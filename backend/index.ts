import express from "express";
import cors from "cors";
import config from "./config";
import groupRoutes from "./routers/group";
// import userRoutes from "./routers/user";
// import expenseRoutes from "./routers/expense";

const app = express();
const PORT = config.server.port;

app.use(cors());
app.use(express.json());
app.use("/api/groups", groupRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/expenses', expenseRoutes);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});