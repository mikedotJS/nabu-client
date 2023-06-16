const WebSocket = require("ws");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class Client {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.username = null;
    this.socket = null;
    this.lastPrivateMessageSender = null;
  }

  connect() {
    if (this.host === "localhost") {
      this.socket = new WebSocket(
        `ws://${this.host}:${this.port}`,
        "echo-protocol"
      );
    } else {
      this.socket = new WebSocket(
        `wss://${this.host}:${this.port}`,
        "echo-protocol"
      );
    }

    this.socket.on("open", () => {
      console.log("Connected to the Slack-Clone server");
    });

    this.socket.on("message", (message) => {
      this.handleData(message);
    });

    this.socket.on("close", () => {
      console.log("Disconnected from the server");
      process.exit();
    });

    this.socket.on("error", (error) => {
      console.log(`Error: ${error}`);
      process.exit();
    });
  }

  handleData(data) {
    const message = data.toString();

    if (message.startsWith("Welcome") || message.includes("Enter a command:")) {
      console.log(message);
    } else if (message.includes("(private)")) {
      const senderUsername = message.split(" ")[0];
      this.lastPrivateMessageSender = senderUsername;
      console.log(message);
    } else {
      console.log(message);
      rl.prompt();
    }
  }

  handleReplyInput(message) {
    if (this.lastPrivateMessageSender) {
      this.send(`/reply ${message}`);
    } else {
      console.log("No previous private message sender found.");
      rl.prompt();
    }
  }

  handlePrivateMessageInput(message) {
    const [command, recipient, ...messageParts] = message.split(" ");

    if (recipient && messageParts.length > 0) {
      this.send(`/pm ${recipient} ${messageParts.join(" ")}`);
    } else {
      console.log(
        "Invalid private message format. Usage: /pm <recipient> <message>"
      );
      rl.prompt();
    }
  }

  handleReactionInput(input) {
    const [command, messageId, emoji] = input.split(" ");

    if (command === "/react") {
      this.send(`/react ${messageId} ${emoji}`);
    } else {
      console.log("Invalid command. Please enter a valid command.");
      rl.prompt();
    }
  }

  send(message) {
    this.socket.send(message);
  }

  start() {
    rl.question("Enter your username: ", (username) => {
      this.username = username.trim();
      this.send(this.username);
    });

    rl.on("line", (input) => {
      const [command] = input.split(" ");

      if (command === "/reply") {
        this.handleReplyInput(input.substring("/reply ".length));
      } else if (command === "/r") {
        this.handleReplyInput(input.substring("/r ".length));
      } else if (command === "/pm") {
        this.handlePrivateMessageInput(input);
      } else {
        this.send(input);
      }
    });

    rl.prompt();
  }
}

const client = new Client("nabu-server.onrender.com", ""); // Update host and port accordingly
// const client = new Client("localhost", 3000); // Update host and port accordingly
client.connect();
client.start();
