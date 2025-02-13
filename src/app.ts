import express from "express";
import * as bodyParser from "body-parser";
import "express-async-errors";
import cors from "cors";
import router from "./servers/index";
import { errorHandler } from "./middlewares/errorHandler";
import { createSupabaseClient } from "./init/supabase";


// Initialize Supabase Client.
const supabaseClient = createSupabaseClient();
const userSupabaseClient = createSupabaseClient();

export const server = express();

server.use(bodyParser.json());

// Define Redis client.
server.use((req: any, res, next) => {
  req.supabaseClient = supabaseClient;
  req.userSupabaseClient = userSupabaseClient;
  next();
});

server.use(cors({ origin: true }));

server.use("/app", router);

server.use(errorHandler);

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
