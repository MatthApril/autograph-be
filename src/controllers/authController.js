const prisma = require("../config/prisma");

const fetchUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    return res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  fetchUsers,
};