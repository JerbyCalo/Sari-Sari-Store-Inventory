const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const { randomUUID } = require("crypto");

const dataFilePath = path.join(__dirname, "data", "inventory.json");

const defaultData = {
  items: [],
  sales: {
    total: 0,
  },
};

const generateId = () => {
  if (typeof randomUUID === "function") {
    return randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ensureDataFileExists = async () => {
  try {
    await fs.access(dataFilePath);
  } catch (error) {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(
      dataFilePath,
      JSON.stringify(defaultData, null, 2),
      "utf8"
    );
  }
};

const normalizeItem = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const normalized = {
    id: item.id || generateId(),
    name: typeof item.name === "string" ? item.name.trim() : "",
    price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
    quantity: Number.isInteger(Number(item.quantity))
      ? Number.parseInt(item.quantity, 10)
      : 0,
  };

  if (!normalized.name) {
    return null;
  }

  normalized.price =
    Number.isFinite(normalized.price) && normalized.price >= 0
      ? Number.parseFloat(normalized.price.toFixed(2))
      : 0;

  normalized.quantity =
    Number.isInteger(normalized.quantity) && normalized.quantity >= 0
      ? normalized.quantity
      : 0;

  return normalized;
};

const normalizeDataShape = (candidate) => {
  let mutated = false;
  let working = candidate;

  if (Array.isArray(candidate)) {
    mutated = true;
    working = { ...defaultData, items: candidate };
  }

  if (!working || typeof working !== "object") {
    mutated = true;
    working = { ...defaultData };
  }

  if (!Array.isArray(working.items)) {
    mutated = true;
    working.items = [];
  }

  const normalizedItems = working.items
    .map((item) => normalizeItem(item))
    .filter((item) => item && item.name);

  if (normalizedItems.length !== working.items.length) {
    mutated = true;
  }

  const salesTotalRaw = Number(working?.sales?.total);
  const normalizedSalesTotal =
    Number.isFinite(salesTotalRaw) && salesTotalRaw >= 0
      ? Number.parseFloat(salesTotalRaw.toFixed(2))
      : 0;

  if (!working.sales || typeof working.sales !== "object") {
    mutated = true;
  }

  const normalized = {
    items: normalizedItems,
    sales: {
      total: normalizedSalesTotal,
    },
  };

  return { normalized, mutated };
};

const writeData = async (data) => {
  await ensureDataFileExists();
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(dataFilePath, payload, "utf8");
};

const readData = async () => {
  await ensureDataFileExists();

  try {
    const fileContent = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(fileContent);
    const { normalized, mutated } = normalizeDataShape(parsed);

    if (mutated) {
      await writeData(normalized);
    }

    return normalized;
  } catch (error) {
    console.error("Failed to read inventory file", error);
    await writeData(defaultData);
    return { ...defaultData };
  }
};

const validateIncomingItem = (incoming) => {
  const name = typeof incoming?.name === "string" ? incoming.name.trim() : "";
  const priceValue = Number.parseFloat(incoming?.price);
  const quantityValue = Number.parseInt(incoming?.quantity, 10);

  if (!name) {
    throw new Error("Product name is required.");
  }

  if (!Number.isFinite(priceValue) || priceValue < 0) {
    throw new Error("Price must be a non-negative number.");
  }

  if (!Number.isInteger(quantityValue) || quantityValue < 0) {
    throw new Error("Quantity must be a non-negative integer.");
  }

  return {
    name,
    price: Number.parseFloat(priceValue.toFixed(2)),
    quantity: quantityValue,
  };
};

const appendInventoryItem = async (incoming) => {
  const validated = validateIncomingItem(incoming);
  const data = await readData();

  const newItem = {
    id: generateId(),
    ...validated,
  };

  data.items.push(newItem);
  await writeData(data);
  return data;
};

const deleteInventoryItem = async (payload) => {
  const data = await readData();
  const { id, quantityToRemove } = payload || {};

  if (!id) {
    throw new Error("Item id is required for deletion.");
  }

  const index = data.items.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error("Item not found.");
  }

  if (typeof quantityToRemove === "number") {
    const parsedQuantity = Number.parseInt(quantityToRemove, 10);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      throw new Error("Quantity to remove must be a positive integer.");
    }

    const updatedQuantity = data.items[index].quantity - parsedQuantity;

    if (updatedQuantity > 0) {
      data.items[index] = { ...data.items[index], quantity: updatedQuantity };
    } else {
      data.items.splice(index, 1);
    }
  } else {
    data.items.splice(index, 1);
  }

  await writeData(data);
  return data;
};

const resetInventory = async () => {
  const resetPayload = {
    items: [],
    sales: {
      total: 0,
    },
  };

  await writeData(resetPayload);
  return resetPayload;
};

const recordSale = async (payload) => {
  const data = await readData();
  const { id, quantitySold } = payload || {};

  if (!id) {
    throw new Error("Item id is required to record a sale.");
  }

  const saleQuantity = Number.parseInt(quantitySold, 10);

  if (!Number.isInteger(saleQuantity) || saleQuantity <= 0) {
    throw new Error("Sold quantity must be a positive integer.");
  }

  const index = data.items.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error("Item not found.");
  }

  const item = data.items[index];

  if (saleQuantity > item.quantity) {
    throw new Error("Sold quantity exceeds available stock.");
  }

  const updatedQuantity = item.quantity - saleQuantity;
  const saleAmount = Number.parseFloat((item.price * saleQuantity).toFixed(2));

  if (updatedQuantity > 0) {
    data.items[index] = { ...item, quantity: updatedQuantity };
  } else {
    data.items.splice(index, 1);
  }

  const currentTotal =
    Number.isFinite(data.sales.total) && data.sales.total >= 0
      ? data.sales.total
      : 0;

  data.sales.total = Number.parseFloat((currentTotal + saleAmount).toFixed(2));

  await writeData(data);
  return data;
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#05060a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "public", "index.html"));
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("inventory:list", async () => readData());
ipcMain.handle("inventory:add", async (_event, payload) =>
  appendInventoryItem(payload)
);
ipcMain.handle("inventory:delete", async (_event, payload) =>
  deleteInventoryItem(payload)
);
ipcMain.handle("inventory:sell", async (_event, payload) =>
  recordSale(payload)
);
ipcMain.handle("inventory:reset", async () => resetInventory());
