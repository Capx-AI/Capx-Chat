/* eslint-disable new-cap */
import express from "express";

import usersRouter from "./users/index";
import chatRouter from "./chat/index";

const router = express.Router();

router.use("/users", usersRouter);
router.use("/chat", chatRouter);

export default router;