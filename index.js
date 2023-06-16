const net = require("net");
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
    this.socket = new net.Socket();
    this.lastPrivateMessageSender = null;
  }

  connect() {
    this.socket.connect(this.port, this.host, () => {
      console.log("Connected to the Slack-Clone server");
    });

    this.socket.on("data", (data) => {
      const message = data.toString();
      this.handleData(message);
    });

    this.socket.on("end", () => {
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
    } else if (message.includes("(private):")) {
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

  send(message) {
    this.socket.write(`${message}\n`);
  }

  start() {
    rl.question("Enter your username: ", (username) => {
      this.username = username.trim();
      this.send(this.username);
    });

    rl.on("line", (input) => {
      if (input.startsWith("/reply")) {
        this.handleReplyInput(input.substring("/reply ".length));
      } else if (input.startsWith("/pm")) {
        this.handlePrivateMessageInput(input);
      } else {
        this.send(input);
      }
    });

    rl.prompt();
  }
}

const client = new Client("localhost", 3000); // Default host and port
client.connect();
client.start();
