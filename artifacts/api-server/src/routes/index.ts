import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import accountsRouter from "./accounts";
import entriesRouter from "./entries";
import reportsRouter from "./reports";
import upiRouter from "./upi";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(accountsRouter);
router.use(entriesRouter);
router.use(reportsRouter);
router.use(upiRouter);
router.use(usersRouter);

export default router;
