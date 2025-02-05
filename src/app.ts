// Import necessary xterm modules and the fit addon.
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

// A simple configuration store.
const configStore: { [key: string]: string } = {};

// Define the root commands.
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
            // Simulate async download delay.
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
        if (args.length === 0) {
          terminal.writeln('\r\nAvailable commands:');
          rootCommand.children?.forEach(child => {
            terminal.writeln(`- ${child.cmd}: ${child.description}`);
          });
        } else {
          // Recursively traverse the command tree.
          function findCommand(tokens: string[], current: Command): Command | undefined {
            if (tokens.length === 0) return current;
            const token = tokens[0];
            const child = current.children?.find(c => c.cmd === token);
            return child ? findCommand(tokens.slice(1), child) : undefined;
          }
          const found = findCommand(args, rootCommand);
          if (found) {
            terminal.writeln('\r\nHelp:');
            terminal.writeln(`Command: ${found.cmd || '<root>'}`);
            terminal.writeln(`Description: ${found.description}`);
            if (found.execute && found.usage) {
              terminal.writeln(`Usage: ${found.usage}`);
            }
            if (found.children && found.children.length > 0) {
              terminal.writeln('Subcommands:');
              found.children.forEach(child => {
                terminal.writeln(`- ${child.cmd}: ${child.description}`);
              });
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

// Recursive command executor.
async function executeCommand(tokens: string[], command: Command, terminal: Terminal): Promise<void> {
  if (tokens.length > 0 && command.children?.length) {
    const token = tokens[0];
    const child = command.children.find(c => c.cmd === token);
    if (child) {
      await executeCommand(tokens.slice(1), child, terminal);
      return;
    }
  }
  if (command.execute) {
    await command.execute(tokens, terminal);
  } else {
    terminal.writeln('\r\nUnknown or incomplete command.');
  }
}

// Terminal initialization and input handling.
function initTerminal(): void {
  // Create a terminal with the Solarized Dark theme.
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

  // Prompt symbol and input buffer variables.
  const prompt = '> ';
  let inputBuffer = '';
  let cursorPosition = 0;
  let isExecuting = false;

  // Function to redraw the input line.
  function redrawInput() {
    terminal.write('\r\x1b[2K' + prompt + inputBuffer);
    const posFromEnd = inputBuffer.length - cursorPosition;
    if (posFromEnd > 0) {
      terminal.write(`\x1b[${posFromEnd}D`);
    }
  }

  // Handlers for various control sequences:
  function handlePrintable(ch: string) {
    inputBuffer = inputBuffer.slice(0, cursorPosition) + ch + inputBuffer.slice(cursorPosition);
    cursorPosition += ch.length;
    redrawInput();
  }

  function handleBackspace() {
    if (cursorPosition > 0) {
      inputBuffer = inputBuffer.slice(0, cursorPosition - 1) + inputBuffer.slice(cursorPosition);
      cursorPosition--;
      redrawInput();
    }
  }

  function handleDelete() {
    if (cursorPosition < inputBuffer.length) {
      inputBuffer = inputBuffer.slice(0, cursorPosition) + inputBuffer.slice(cursorPosition + 1);
      redrawInput();
    }
  }

  function handleArrowLeft() {
    if (cursorPosition > 0) {
      cursorPosition--;
      redrawInput();
    }
  }

  function handleArrowRight() {
    if (cursorPosition < inputBuffer.length) {
      cursorPosition++;
      redrawInput();
    }
  }

  function handleHome() {
    cursorPosition = 0;
    redrawInput();
  }

  function handleEnd() {
    cursorPosition = inputBuffer.length;
    redrawInput();
  }

  function handleEnter() {
    terminal.write('\r\n');
    const commandLine = inputBuffer.trim();
    inputBuffer = '';
    cursorPosition = 0;
    if (commandLine.length === 0) {
      terminal.write(prompt);
      return;
    }
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
  }

  // Process onData with a custom parser for escape sequences and printable characters.
  terminal.onData((data: string) => {
    if (isExecuting) return;

    let i = 0;
    while (i < data.length) {
      // Check if the character is an escape sequence initiator.
      if (data[i] === '\x1b') {
        // Recognize known escape sequences:
        if (data.substr(i, 3) === "\x1b[D") { // Arrow Left
          handleArrowLeft();
          i += 3;
          continue;
        } else if (data.substr(i, 3) === "\x1b[C") { // Arrow Right
          handleArrowRight();
          i += 3;
          continue;
        } else if (data.substr(i, 3) === "\x1b[A") {
          // Arrow Up (not implemented) — just skip it.
          i += 3;
          continue;
        } else if (data.substr(i, 3) === "\x1b[B") {
          // Arrow Down (not implemented) — just skip it.
          i += 3;
          continue;
        } else if (data.substr(i, 4) === "\x1b[3~") { // Delete
          handleDelete();
          i += 4;
          continue;
        } else if (data.substr(i, 3) === "\x1b[H") { // Home key
          handleHome();
          i += 3;
          continue;
        } else if (data.substr(i, 3) === "\x1b[F") { // End key
          handleEnd();
          i += 3;
          continue;
        } else {
          // Unrecognized escape sequence; skip the ESC character.
          i++;
          continue;
        }
      } else {
        // Process normal characters or control characters.
        const ch = data[i];
        if (ch === "\r" || ch === "\n") {
          handleEnter();
        } else if (ch === "\x7F" || ch === "\x08") { // ASCII Backspace
          handleBackspace();
        } else {
          // Any other printable or Unicode character.
          handlePrintable(ch);
        }
        i++;
      }
    }
  });

  window.addEventListener('resize', () => fitAddon.fit());
  terminal.write(prompt);
}

// Start the terminal once the DOM is loaded.
document.addEventListener('DOMContentLoaded', () => {
  initTerminal();
});