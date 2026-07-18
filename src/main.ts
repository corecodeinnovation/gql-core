// gql-core — bootstrap. Apollo + subscriptions vía graphql-ws.
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // landing de marca CCI en "/" (public/index.html); el API vive en /graphql
  app.useStaticAssets(join(__dirname, "..", "public"));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
