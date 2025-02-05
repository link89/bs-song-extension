import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

// Define the context interface for command execution
interface Context {
  terminal: Terminal;
  args: string[];
}

// Updated Command interface with description and usage.
interface Command {
  command?: string;
  description: string;
  usage?: string; // Changed from required to optional
  execute?: (ctx: Context) => Promise<void> | void;
  children?: Command[];
}

// Global configuration store for config commands
const configStore: { [key: string]: string } = {};

// Create a terminal using xterm.js with Solarized colors
const terminal = new Terminal({
  theme: {
    background: '#002b36',
    foreground: '#839496',
  }
});

// Create and load the FitAddon to support auto-resizing.
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

terminal.open(document.getElementById('terminal-container')!);
// Fit the terminal to the container's dimensions
fitAddon.fit();

terminal.writeln('Welcome to the Command Line App');
terminal.write('> ');

let currentInput = '';
let isExecuting: boolean = false;

// Adjust the terminal's size on window resize
window.addEventListener('resize', () => {
  fitAddon.fit();
});

// Function to process a full command input upon pressing Enter.
// This function waits for command execution before showing a new prompt.
const processCommand = async (input: string) => {
  isExecuting = true;
  const tokens = input.trim().split(/\s+/);
  if (tokens.length === 0 || tokens[0] === '') {
    terminal.write('> ');
    isExecuting = false;
    return;
  }
  await executeCommand(rootCommand, tokens);
  terminal.write('> ');
  isExecuting = false;
};

// Recursively search through the command tree and execute the matching command.
// If no matching subcommand is found but the current node has an execute method,
// it passes the remaining tokens as arguments.
const executeCommand = async (commandNode: Command, tokens: string[]): Promise<void> => {
  if (!commandNode.children || tokens.length === 0) {
    if (commandNode.execute) {
      await commandNode.execute({ terminal, args: tokens });
    } else {
      terminal.writeln('Command not found or no executable command.');
    }
    return;
  }
  
  const child = commandNode.children.find(cmd => cmd.command === tokens[0]);
  if (child) {
    await executeCommand(child, tokens.slice(1));
  } else {
    if (commandNode.execute) {
      await commandNode.execute({ terminal, args: tokens });
    } else {
      terminal.writeln('Command not found.');
    }
  }
};

// Helper function to fetch a command by following the token path.
const getCommandByPath = (commandNode: Command, tokens: string[]): Command | null => {
  if (!tokens || tokens.length === 0) {
    return commandNode;
  }
  if (!commandNode.children) return null;
  const child = commandNode.children.find(cmd => cmd.command === tokens[0]);
  return child ? getCommandByPath(child, tokens.slice(1)) : null;
};

// Helper function to construct the full command from tokens.
const getFullCommand = (tokens: string[]): string => {
  return tokens.join(' ');
};

// Helper function to print help information for a specific command.
const printCommandHelp = (fullCommand: string, cmd: Command, terminal: Terminal): void => {
  if (fullCommand) {
    terminal.writeln(`${fullCommand} - ${cmd.description}`);
  } else {
    terminal.writeln(cmd.description);
  } 

  if (cmd.children && cmd.children.length > 0) {
    terminal.writeln("  Subcommands:");
    cmd.children.forEach(child => {
      terminal.writeln(`    ${child.command} - ${child.description}`);
    });
  } else {
    // If no children, print the usage.
    if (cmd.usage) {
      terminal.writeln("  Usage:");
      terminal.writeln(`    ${fullCommand} ${cmd.usage}`);
    }
  }
};

// Define the recursive command tree.
const rootCommand: Command = {
  description: 'Welcome to Beat Saber Song Manager',
  children: [
    {
      command: "song",
      description: "Operations for songs",
      children: [
        {
          command: "ls",
          description: "List available songs",
          execute: async (ctx: Context) => {
            ctx.terminal.writeln("Song1\nSong2\nSong3");
          }
        },
        {
          command: "download",
          description: "Download a song from the given URL",
          usage: "<url>",
          execute: async (ctx: Context) => {
            const url = ctx.args[0];
            if (!url) {
              ctx.terminal.writeln("Error: No URL provided.");
              return;
            }
            ctx.terminal.writeln(`Downloading song from ${url}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            ctx.terminal.writeln("Download completed (simulated).");
          }
        }
      ]
    },
    {
      command: "config",
      description: "Get or set configuration values",
      children: [
        {
          command: "get",
          description: "Get the value of the configuration key",
          usage: "<key>",
          execute: (ctx: Context) => {
            const key = ctx.args[0];
            if (!key) {
              ctx.terminal.writeln("Error: No key provided.");
              return;
            }
            const value = configStore[key];
            if (value === undefined) {
              ctx.terminal.writeln(`Configuration for '${key}' not found.`);
            } else {
              ctx.terminal.writeln(`${key} = ${value}`);
            }
          }
        },
        {
          command: "set",
          description: "Set a new value for the configuration key",
          usage: "<key> <value>",
          execute: (ctx: Context) => {
            const key = ctx.args[0];
            const value = ctx.args[1];
            if (!key || !value) {
              ctx.terminal.writeln("Usage: config set <key> <value>");
              return;
            }
            configStore[key] = value;
            ctx.terminal.writeln(`Configuration '${key}' set to '${value}'.`);
          }
        }
      ]
    },
    {
      command: "help",
      description: "Show usage information for commands",
      usage: "[<command> ...]",

      execute: (ctx: Context) => {
        if (ctx.args.length === 0) {
          printCommandHelp("", rootCommand, ctx.terminal);
        } else {
          const cmd = getCommandByPath(rootCommand, ctx.args);
          if (cmd) {
            const fullCmd = getFullCommand(ctx.args);
            printCommandHelp(fullCmd, cmd, ctx.terminal);
          } else {
            terminal.writeln("No help available for the specified command.");
          }
        }
      }
    },
    {
      command: "clear",
      description: "Clear the terminal",
      usage: "",
      execute: (ctx: Context) => {
        ctx.terminal.reset();
      }
    }
  ]
};

// Handle terminal data input. Input is ignored when a command is executing.
terminal.onData((data: string) => {
  if (isExecuting) return;
  if (data === "\r") {  // Enter key pressed
    terminal.writeln('');
    processCommand(currentInput);
    currentInput = '';
  } else if (data === "\u007F") {  // Backspace key pressed
    if (currentInput.length > 0) {
      currentInput = currentInput.slice(0, -1);
      terminal.write('\b \b');
    }
  } else {
    currentInput += data;
    terminal.write(data);
  }
});