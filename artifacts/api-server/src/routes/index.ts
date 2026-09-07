import { Router, type IRouter } from "express";
import healthRouter from "./health";
import yconnectRouter from "./yconnect";

const router: IRouter = Router();

router.use(healthRouter);
router.use(yconnectRouter);

export default router;
