export class ConsumerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Consumer Error";
  }
}
