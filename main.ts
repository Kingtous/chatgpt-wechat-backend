/// CONFIGURE ENV START
import dotenv from "dotenv";
dotenv.config({
  debug: true
});
/// CONFIGURE ENV END
import Fastify from "fastify";
import parser from './src/utils/parser';
import router from './src/router';
import crontab from './src/crontab';
/// CONST AREA START
const server = Fastify({
  logger: true,
});
const port = parseInt(process.env.PORT || "3000")
/// CONST AREA END

/// XML CONF
// server.register(require("fastify-xml-body-parser"), {
//   contentType: 'application/xml',
//   validate: true
// })

function main() {
  parser(server);
  router(server);
  // crontab();
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
