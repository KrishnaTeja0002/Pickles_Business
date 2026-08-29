import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { csrfProtection, issueCsrfToken } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/error-handler.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { cartRouter } from "./routes/cart.routes.js";
import { catalogRouter } from "./routes/catalog.routes.js";
import { contentRouter } from "./routes/content.routes.js";
import { orderRouter } from "./routes/order.routes.js";
import { paymentRouter } from "./routes/payment.routes.js";
import { userRouter } from "./routes/user.routes.js";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.WEB_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 400, standardHeaders: true }));

app.get("/health", (_req, res) => res.json({ ok: true, name: "Ur Home Taste API" }));
app.get("/api/csrf-token", issueCsrfToken);

app.use("/api/auth", authRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", csrfProtection, orderRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/users", csrfProtection, userRouter);
app.use("/api/admin", csrfProtection, adminRouter);
app.use("/api/content", contentRouter);

app.use(errorHandler);
