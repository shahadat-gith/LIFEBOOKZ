import dns from "node:dns/promises";

console.log(await dns.getServers());

try {
  console.log(
    await dns.resolveSrv("_mongodb._tcp.cluster0.cwobxzy.mongodb.net")
  );
} catch (err) {
  console.error(err);
}