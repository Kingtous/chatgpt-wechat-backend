import Fastify from "fastify";
import router from './src/router';
/// CONFIGURE ENV START
import dotenv from "dotenv";
dotenv.config();
/// CONFIGURE ENV END

/// CONST AREA START
const server = Fastify({
  logger: true,
});
const port = 3000
/// CONST AREA END

function main() {
  router(server);
  // Run the server!
  server.listen({ port: port }, function (err, address) {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
    // Server is now listening on ${address}
    console.log("Server listening at", port)
  });
}

main();
