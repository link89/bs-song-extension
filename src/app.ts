// Import necessary xterm modules and the fit addon.
// Note: External dependencies are injected, so they can be replaced by the dependency injection container.
import { Terminal, ITheme } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

// Define a Command interface and command tree for our song management demo
interface Command {
  cmd?: string;
  description: string;
  usage?: string;
  execute?: (args: string[], terminal: Terminal) => Promise<void>;
  children?: Command[];
}

// A simple configuration store
const configStore: { [key: string]: string } = {};

// Define the root commands
const rootCommand: Command = {
  description: 'Welcome to song manager',
  children: [
    {
      cmd: 'song',
      description: 'Manage songs',
      children: [
        {
          cmd: 'ls',
          description: 'List all songs',
          execute: async (_args: string[], terminal: Terminal) => {
            // Simulate a listing of songs
            terminal.writeln('\r\nSong List:');
            terminal.writeln('1. Song A');
            terminal.writeln('2. Song B');
            terminal.writeln('3. Song C');
          }
        },
        {
          cmd: 'download',
          description: 'Download a song',
          usage: 'download <url>',
          execute: async (args: string[], terminal: Terminal) => {
            if (args.length < 1) {
              terminal.writeln('\r\nUsage: song download <url>');
              return;
            }
            const url = args[0];
            terminal.writeln(`\r\nDownloading song from: ${url} ...`);
            // Simulate an async download task with delay
            await new Promise(res => setTimeout(res, 1500));
            terminal.writeln('Download completed.');
          }
        }
      ]
    },
    {
      cmd: 'config',
      description: 'Manage configuration',
      children: [
        {
          cmd: 'set',
          description: 'Set configuration',
          usage: 'set <key> <value>',
          execute: async (args: string[], terminal: Terminal) => {
            if (args.length < 2) {
              terminal.writeln('\r\nUsage: config set <key> <value>');
              return;
            }
            const key = args[0];
            const value = args[1];
            configStore[key] = value;
            terminal.writeln(`\r\nConfiguration updated: ${key} = ${value}`);
          }
        },
        {
          cmd: 'get',
          description: 'Get configuration',
          usage: 'get <key>',
          execute: async (args: string[], terminal: Terminal) => {
            if (args.length < 1) {
              terminal.writeln('\r\nUsage: config get <key>');
              return;
            }
            const key = args[0];
            const value = configStore[key];
            terminal.writeln(`\r\nConfiguration: ${key} = ${value ? value : 'undefined'}`);
          }
        }
      ]
    },
    {
      cmd: 'help',
      description: 'Show help information',
      usage: 'help [cmd]',
      execute: async (args: string[], terminal: Terminal) => {
        // If no argument given, list top-level commands.
        if (args.length === 0) {
          terminal.writeln('\r\nAvailable commands:');
          rootCommand.children?.forEach(child => {
            terminal.writeln(`- ${child.cmd}: ${child.description}`);
          });
        } else {
          // Show help information for a specific command recursively.
          function findCommand(tokens: string[], current: Command): Command | undefined {
            if (tokens.length === 0) return current;
            const token = tokens[0];
            const child = current.children?.find(c => c.cmd === token);
            if (child) {
              return findCommand(tokens.slice(1), child);
            }
            return undefined;
          }
          const cmdToFind = args;
          const found = findCommand(cmdToFind, rootCommand);
          if (found) {
            terminal.writeln('\r\nHelp:');
            terminal.writeln(`Command: ${found.cmd || '<root>'}`);
            terminal.writeln(`Description: ${found.description}`);
            if (found.usage) {
              terminal.writeln(`Usage: ${found.usage}`);
            }
          } else {
            terminal.writeln('\r\nNo matching command found.');
          }
        }
      }
    },
    {
      cmd: 'clear',
      description: 'Clear terminal',
      execute: async (_args: string[], terminal: Terminal) => {
        terminal.clear();
      }
    }
  ]
};

// Recursive command executor
async function executeCommand(tokens: string[], command: Command, terminal: Terminal): Promise<void> {
  // If there are tokens, try to match children
  if (tokens.length > 0 && command.children?.length) {
    const token = tokens[0];
    const child = command.children.find(c => c.cmd === token);
    if (child) {
      // Recurse with remaining tokens
      await executeCommand(tokens.slice(1), child, terminal);
      return;
    }
  }
  // If execute function exists for this command, run it with tokens as arguments
  if (command.execute) {
    await command.execute(tokens, terminal);
  } else {
    terminal.writeln('\r\nUnknown or incomplete command.');
  }
}

// Terminal initialization and input handling
function initTerminal(): void {
  // Create terminal with Solarized Dark theme
  const theme: Partial<ITheme> = {
    background: '#002b36',
    foreground: '#839496',
    cursor: '#93a1a1'
  };

  const terminal = new Terminal({
    theme: theme,
    cursorBlink: true,
    convertEol: true
  });
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(document.getElementById('terminal-container')!);
  fitAddon.fit();

  // Prompt symbol and input buffer
  const prompt = '> ';
  let inputBuffer = '';
  let cursorPosition = 0;
  let isExecuting = false; // when a command is executing, disable further user input

  // Helper function to redraw the current input line.
  function redrawInput() {
    // Clear current line and reprint prompt and input buffer
    // \x1b[2K clears the entire line; \r returns carriage.
    terminal.write('\r\x1b[2K' + prompt + inputBuffer);
    // Move cursor to the correct position (if not at end)
    const posFromEnd = inputBuffer.length - cursorPosition;
    if (posFromEnd > 0) {
      terminal.write(`\x1b[${posFromEnd}D`);
    }
  }

  // Write the initial prompt
  terminal.write(prompt);

  // Listen to key events from the terminal.
  terminal.onKey(({ key, domEvent }) => {
    if (isExecuting) return; // ignore input during execution

    const ev = domEvent;
    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

    // Handle special keys
    if (ev.key === 'Backspace') {
      if (cursorPosition > 0) {
        inputBuffer = inputBuffer.slice(0, cursorPosition - 1) + inputBuffer.slice(cursorPosition);
        cursorPosition--;
        redrawInput();
      }
    } else if (ev.key === 'Delete') {
      if (cursorPosition < inputBuffer.length) {
        inputBuffer = inputBuffer.slice(0, cursorPosition) + inputBuffer.slice(cursorPosition + 1);
        redrawInput();
      }
    } else if (ev.key === 'ArrowLeft') {
      if (cursorPosition > 0) {
        cursorPosition--;
        redrawInput();
      }
    } else if (ev.key === 'ArrowRight') {
      if (cursorPosition < inputBuffer.length) {
        cursorPosition++;
        redrawInput();
      }
    } else if (ev.key === 'Home') {
      cursorPosition = 0;
      redrawInput();
    } else if (ev.key === 'End') {
      cursorPosition = inputBuffer.length;
      redrawInput();
    } else if (ev.key === 'Enter') {
      // On Enter, execute the command and then print a new prompt.
      terminal.write('\r\n');
      const commandLine = inputBuffer.trim();
      // Clear input buffer and reset cursor position
      inputBuffer = '';
      cursorPosition = 0;
      if (commandLine.length === 0) {
        terminal.write(prompt);
        return;
      }
      // Tokenize the commandLine by whitespace.
      const tokens = commandLine.split(/\s+/);
      isExecuting = true;
      executeCommand(tokens, rootCommand, terminal)
        .catch((error: any) => {
          terminal.writeln(`\r\nError executing command: ${error.message || error}`);
        })
        .finally(() => {
          isExecuting = false;
          terminal.write('\r\n' + prompt);
        });
    } else if (printable && ev.key.length === 1) {
      // Accept printable characters
      inputBuffer = inputBuffer.slice(0, cursorPosition) + key + inputBuffer.slice(cursorPosition);
      cursorPosition++;
      redrawInput();
    }
    // Other non-character keys are ignored.
  });

  // Adjust terminal size when window is resized.
  window.addEventListener('resize', () => {
    fitAddon.fit();
  });
}

// Start our terminal when the DOM is loaded.
document.addEventListener('DOMContentLoaded', () => {
  initTerminal();
});