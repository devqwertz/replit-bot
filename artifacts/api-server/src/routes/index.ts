import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scriptsRouter from "./scripts";
import logsRouter from "./logs";
import analyticsRouter from "./analytics";
import loadRouter from "./load";
import bansRouter from "./bans";
import pingRouter from "./ping";
import sessionsRouter from "./sessions";
import keycheckRouter from "./keycheck";
import userKeysRouter from "./user-keys";

const router: IRouter = Router();

router.use(healthRouter);
router.use(keycheckRouter);
router.use(userKeysRouter);
router.use(loadRouter);
router.use(pingRouter);
router.use(scriptsRouter);
router.use(logsRouter);
router.use(analyticsRouter);
router.use(bansRouter);
router.use(sessionsRouter);

export default router;
