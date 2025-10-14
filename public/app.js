const inventoryTableBody = document.getElementById("inventory-body");
const itemForm = document.getElementById("item-form");
const addItemButton = document.getElementById("add-item");
const refreshButton = document.getElementById("refresh-demo");
const resetButton = document.getElementById("reset-inventory");
const searchField = document.getElementById("search");
const inventoryValueEl = document.getElementById("inventory-value");
const salesTotalEl = document.getElementById("sales-total");
const productNameInput = document.getElementById("product-name");
const quantityModal = document.getElementById("quantity-modal");
const quantityModalForm = document.getElementById("quantity-modal-form");
const quantityModalInput = document.getElementById("quantity-modal-input");
const quantityModalError = document.getElementById("quantity-modal-error");
const quantityModalTitle = document.getElementById("quantity-modal-title");
const quantityModalMessage = document.getElementById("quantity-modal-message");
const quantityModalCancel = document.getElementById("quantity-modal-cancel");
const confirmModal = document.getElementById("confirm-modal");
const confirmModalTitle = document.getElementById("confirm-modal-title");
const confirmModalMessage = document.getElementById("confirm-modal-message");
const confirmModalConfirm = document.getElementById("confirm-modal-confirm");
const confirmModalCancel = document.getElementById("confirm-modal-cancel");

const hasInventoryBridge =
  typeof window !== "undefined" && !!window.inventoryAPI;
const fallbackInventory = [];
let fallbackSalesTotal = 0;

const appState = {
  items: [],
  filter: "",
  salesTotal: 0,
};

const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "₱0.00";
  }

  return `₱${amount.toFixed(2)}`;
};

let lastFocusedElement = null;

const focusPrimaryInput = () => {
  if (productNameInput) {
    productNameInput.focus({ preventScroll: true });
  }
};

const fallbackPromptQuantity = ({ message, defaultValue }) => {
  const rawValue = window.prompt(message, defaultValue ?? "");
  if (rawValue === null) {
    return null;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    window.alert("Please enter a positive whole number.");
    return undefined;
  }

  return parsed;
};

const hideQuantityModal = () => {
  if (!quantityModal) {
    return;
  }

  quantityModal.classList.remove("is-open");
  setTimeout(() => {
    if (!quantityModal.classList.contains("is-open")) {
      quantityModal.setAttribute("hidden", "");
    }
  }, 160);
};

const showQuantityModal = ({ title, message, defaultValue }) => {
  if (
    !quantityModal ||
    !quantityModalForm ||
    !quantityModalInput ||
    !quantityModalCancel ||
    !quantityModalTitle ||
    !quantityModalMessage ||
    !quantityModalError
  ) {
    return Promise.resolve(fallbackPromptQuantity({ message, defaultValue }));
  }

  if (quantityModal.classList.contains("is-open")) {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve) => {
    const finalize = (result) => {
      hideQuantityModal();

      quantityModalForm.removeEventListener("submit", handleSubmit);
      quantityModalCancel.removeEventListener("click", handleCancel);
      quantityModal.removeEventListener("click", handleBackdropClick);
      document.removeEventListener("keydown", handleKeydown, true);

      quantityModalError.hidden = true;

      if (
        lastFocusedElement &&
        typeof lastFocusedElement.focus === "function"
      ) {
        lastFocusedElement.focus({ preventScroll: true });
      }

      resolve(result);
    };

    const handleSubmit = (event) => {
      event.preventDefault();

      const parsed = Number.parseInt(quantityModalInput.value, 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        quantityModalError.textContent =
          "Please enter a positive whole number.";
        quantityModalError.hidden = false;
        quantityModalInput.focus();
        quantityModalInput.select();
        return;
      }

      quantityModalError.hidden = true;
      finalize(parsed);
    };

    const handleCancel = () => {
      finalize(null);
    };

    const handleBackdropClick = (event) => {
      if (event.target === quantityModal) {
        finalize(null);
      }
    };

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finalize(null);
      }
    };

    lastFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    quantityModalTitle.textContent = title;
    quantityModalMessage.textContent = message;
    quantityModalInput.value = defaultValue ?? "";
    quantityModalError.hidden = true;

    quantityModal.removeAttribute("hidden");
    requestAnimationFrame(() => {
      quantityModal.classList.add("is-open");
      quantityModalInput.focus({ preventScroll: true });
      quantityModalInput.select();
    });

    quantityModalForm.addEventListener("submit", handleSubmit);
    quantityModalCancel.addEventListener("click", handleCancel);
    quantityModal.addEventListener("click", handleBackdropClick);
    document.addEventListener("keydown", handleKeydown, true);
  });
};

const requestQuantity = async ({ title, message, defaultValue }) => {
  if (
    quantityModal &&
    quantityModalForm &&
    quantityModalInput &&
    quantityModalCancel &&
    quantityModalTitle &&
    quantityModalMessage &&
    quantityModalError
  ) {
    return showQuantityModal({ title, message, defaultValue });
  }

  return Promise.resolve(fallbackPromptQuantity({ message, defaultValue }));
};

const fallbackConfirm = (message) => window.confirm(message);

const hideConfirmModal = () => {
  if (!confirmModal) {
    return;
  }

  confirmModal.classList.remove("is-open");
  setTimeout(() => {
    if (!confirmModal.classList.contains("is-open")) {
      confirmModal.setAttribute("hidden", "");
    }
  }, 160);
};

const showConfirmModal = ({ title, message, confirmLabel }) => {
  if (
    !confirmModal ||
    !confirmModalTitle ||
    !confirmModalMessage ||
    !confirmModalConfirm ||
    !confirmModalCancel
  ) {
    return Promise.resolve(fallbackConfirm(message));
  }

  if (confirmModal.classList.contains("is-open")) {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve) => {
    const finalize = (result) => {
      hideConfirmModal();

      confirmModalConfirm.removeEventListener("click", handleConfirm);
      confirmModalCancel.removeEventListener("click", handleCancel);
      confirmModal.removeEventListener("click", handleBackdropClick);
      document.removeEventListener("keydown", handleKeydown, true);

      if (
        lastFocusedElement &&
        typeof lastFocusedElement.focus === "function"
      ) {
        lastFocusedElement.focus({ preventScroll: true });
      }

      resolve(result);
    };

    const handleConfirm = () => finalize(true);
    const handleCancel = () => finalize(false);
    const handleBackdropClick = (event) => {
      if (event.target === confirmModal) {
        finalize(false);
      }
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finalize(false);
      }
    };

    lastFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmModalConfirm.textContent = confirmLabel ?? "Confirm";

    confirmModal.removeAttribute("hidden");
    requestAnimationFrame(() => {
      confirmModal.classList.add("is-open");
      confirmModalConfirm.focus({ preventScroll: true });
    });

    confirmModalConfirm.addEventListener("click", handleConfirm);
    confirmModalCancel.addEventListener("click", handleCancel);
    confirmModal.addEventListener("click", handleBackdropClick);
    document.addEventListener("keydown", handleKeydown, true);
  });
};

const requestConfirmation = async ({ title, message, confirmLabel }) => {
  if (
    confirmModal &&
    confirmModalTitle &&
    confirmModalMessage &&
    confirmModalConfirm &&
    confirmModalCancel
  ) {
    return showConfirmModal({ title, message, confirmLabel });
  }

  return Promise.resolve(fallbackConfirm(message));
};

const sanitizeItem = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id = item.id ? String(item.id) : `temp-${Date.now()}`;
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const price = Number.isFinite(Number(item.price))
    ? Number.parseFloat(Number(item.price).toFixed(2))
    : 0;
  const quantity = Number.isInteger(Number(item.quantity))
    ? Number.parseInt(item.quantity, 10)
    : 0;

  if (!name) {
    return null;
  }

  return {
    id,
    name,
    price: price >= 0 ? price : 0,
    quantity: quantity >= 0 ? quantity : 0,
  };
};

const normalizeDataPayload = (payload) => {
  if (Array.isArray(payload)) {
    return { items: payload, sales: { total: 0 } };
  }

  if (!payload || typeof payload !== "object") {
    return { items: [], sales: { total: 0 } };
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const salesTotalRaw = Number(payload?.sales?.total);
  const salesTotal =
    Number.isFinite(salesTotalRaw) && salesTotalRaw >= 0 ? salesTotalRaw : 0;

  return {
    items,
    sales: {
      total: Number.parseFloat(salesTotal.toFixed(2)),
    },
  };
};

const applyInventoryPayload = (payload) => {
  const normalized = normalizeDataPayload(payload);
  appState.items = normalized.items
    .map((item) => sanitizeItem(item))
    .filter(Boolean);
  appState.salesTotal = Number.isFinite(normalized.sales.total)
    ? normalized.sales.total
    : 0;

  renderInventory();
  renderSummary();
};

const calculateTotalInventoryValue = () =>
  appState.items.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );

const calculateTotalSales = () =>
  Number.isFinite(appState.salesTotal) ? appState.salesTotal : 0;

const setTableToMessage = (message) => {
  if (!inventoryTableBody) {
    return;
  }

  inventoryTableBody.innerHTML = `
    <tr class="empty-state">
      <td colspan="4">
        <div>
          <p>${escapeHtml(message)}</p>
        </div>
      </td>
    </tr>
  `;
};

const renderSummary = () => {
  if (!inventoryValueEl || !salesTotalEl) {
    return;
  }

  const totalValue = Number.parseFloat(
    calculateTotalInventoryValue().toFixed(2)
  );
  const totalSales = Number.parseFloat(calculateTotalSales().toFixed(2));

  inventoryValueEl.textContent = formatCurrency(totalValue);
  salesTotalEl.textContent = formatCurrency(totalSales);
};

const renderInventory = () => {
  if (!inventoryTableBody) {
    return;
  }

  const query = appState.filter.trim().toLowerCase();
  const filteredItems = query
    ? appState.items.filter((item) => item.name.toLowerCase().includes(query))
    : appState.items;

  if (filteredItems.length === 0) {
    setTableToMessage(query ? "No items match your search." : "No items yet");
    return;
  }

  const rows = filteredItems
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${formatCurrency(item.price)}</td>
        <td><span class="badge">${escapeHtml(item.quantity)}</span></td>
        <td>
          <div class="actions-group">
            <button type="button" class="action-button action-button--sell" data-sell="${escapeHtml(
              item.id
            )}">Sell</button>
            <button type="button" class="action-button action-button--delete" data-delete="${escapeHtml(
              item.id
            )}">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  inventoryTableBody.innerHTML = rows;
};

const setFormBusy = (isBusy) => {
  if (!addItemButton) return;

  addItemButton.disabled = isBusy;
  addItemButton.textContent = isBusy ? "Adding..." : "Add Item";
};

const getFallbackPayload = () => ({
  items: [...fallbackInventory],
  sales: { total: fallbackSalesTotal },
});

const listInventory = async () => {
  if (!hasInventoryBridge) {
    applyInventoryPayload(getFallbackPayload());
    return;
  }

  setTableToMessage("Loading inventory...");

  try {
    const payload = await window.inventoryAPI.list();
    applyInventoryPayload(payload);
  } catch (error) {
    console.error("Failed to load inventory", error);
    setTableToMessage("Unable to load inventory. Try again.");
  }
};

const handleAddItem = async (event) => {
  event.preventDefault();

  const formData = new FormData(itemForm);
  const payload = {
    name: formData.get("name")?.trim() || "",
    price: Number.parseFloat(formData.get("price")),
    quantity: Number.parseInt(formData.get("quantity"), 10),
  };

  if (!payload.name) {
    window.alert("Product name is required.");
    return;
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    window.alert("Price must be zero or greater.");
    return;
  }

  if (!Number.isInteger(payload.quantity) || payload.quantity < 0) {
    window.alert(
      "Quantity must be a whole number greater than or equal to zero."
    );
    return;
  }

  payload.price = Number.parseFloat(payload.price.toFixed(2));

  setFormBusy(true);

  try {
    if (hasInventoryBridge) {
      const updated = await window.inventoryAPI.add(payload);
      applyInventoryPayload(updated);
    } else {
      const fallbackItem = {
        id: `preview-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...payload,
      };
      fallbackInventory.push({ ...fallbackItem });
      applyInventoryPayload(getFallbackPayload());
    }

    itemForm.reset();
  } catch (error) {
    console.error("Failed to add item", error);
    window.alert("Unable to add item. Please try again.");
  } finally {
    setFormBusy(false);
  }
};

const processDelete = async (deleteButton) => {
  const itemId = deleteButton.getAttribute("data-delete");
  if (!itemId) {
    return;
  }

  const targetItem = appState.items.find((item) => item.id === itemId);
  if (!targetItem) {
    return;
  }

  const quantity = await requestQuantity({
    title: `Delete ${targetItem.name}`,
    message: `Enter quantity to delete (available: ${targetItem.quantity})`,
    defaultValue: String(targetItem.quantity),
  });

  if (quantity === null || quantity === undefined) {
    return;
  }

  deleteButton.disabled = true;
  deleteButton.textContent = "Deleting...";

  try {
    if (hasInventoryBridge) {
      const updated = await window.inventoryAPI.delete({
        id: itemId,
        quantityToRemove: quantity,
      });
      applyInventoryPayload(updated);
    } else {
      const fallbackIndex = fallbackInventory.findIndex(
        (item) => item.id === itemId
      );
      if (fallbackIndex >= 0) {
        const newQuantity =
          fallbackInventory[fallbackIndex].quantity - quantity;
        if (newQuantity > 0) {
          fallbackInventory[fallbackIndex].quantity = newQuantity;
        } else {
          fallbackInventory.splice(fallbackIndex, 1);
        }
        applyInventoryPayload(getFallbackPayload());
      }
    }
  } catch (error) {
    console.error("Failed to delete item", error);
    window.alert("Unable to delete item. Please try again.");
  } finally {
    if (deleteButton.isConnected) {
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete";
    }
  }
};

const processSale = async (sellButton) => {
  const itemId = sellButton.getAttribute("data-sell");
  if (!itemId) {
    return;
  }

  const targetItem = appState.items.find((item) => item.id === itemId);
  if (!targetItem) {
    return;
  }

  const quantity = await requestQuantity({
    title: `Record Sale — ${targetItem.name}`,
    message: `Enter units sold (available: ${targetItem.quantity})`,
    defaultValue: "1",
  });

  if (quantity === null || quantity === undefined) {
    return;
  }

  if (quantity > targetItem.quantity) {
    window.alert("Sold quantity cannot exceed available stock.");
    return;
  }

  sellButton.disabled = true;
  sellButton.textContent = "Selling...";

  try {
    if (hasInventoryBridge) {
      const updated = await window.inventoryAPI.sell({
        id: itemId,
        quantitySold: quantity,
      });
      applyInventoryPayload(updated);
    } else {
      const fallbackIndex = fallbackInventory.findIndex(
        (item) => item.id === itemId
      );
      if (fallbackIndex >= 0) {
        const item = fallbackInventory[fallbackIndex];
        if (quantity > item.quantity) {
          window.alert("Sold quantity cannot exceed available stock.");
        } else {
          const newQuantity = item.quantity - quantity;
          const saleAmount = Number.parseFloat(
            (item.price * quantity).toFixed(2)
          );
          fallbackSalesTotal = Number.parseFloat(
            (fallbackSalesTotal + saleAmount).toFixed(2)
          );

          if (newQuantity > 0) {
            item.quantity = newQuantity;
          } else {
            fallbackInventory.splice(fallbackIndex, 1);
          }

          applyInventoryPayload(getFallbackPayload());
        }
      }
    }
  } catch (error) {
    console.error("Failed to record sale", error);
    window.alert("Unable to record sale. Please try again.");
  } finally {
    if (sellButton.isConnected) {
      sellButton.disabled = false;
      sellButton.textContent = "Sell";
    }
  }
};

const handleTableClick = async (event) => {
  const sellButton = event.target.closest("[data-sell]");
  if (sellButton) {
    await processSale(sellButton);
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    await processDelete(deleteButton);
  }
};

const handleRefreshClick = async () => {
  await listInventory();
};

const handleResetClick = async () => {
  const wantsReset = await requestConfirmation({
    title: "Reset Inventory",
    message: "This will clear all items and reset total sales. Continue?",
    confirmLabel: "Reset",
  });

  if (!wantsReset) {
    focusPrimaryInput();
    return;
  }

  if (hasInventoryBridge) {
    try {
      const payload = await window.inventoryAPI.reset();
      applyInventoryPayload(payload);
    } catch (error) {
      console.error("Failed to reset inventory", error);
      window.alert("Unable to reset inventory. Please try again.");
    }
    window.focus?.();
    focusPrimaryInput();
    return;
  }

  fallbackInventory.splice(0, fallbackInventory.length);
  fallbackSalesTotal = 0;
  applyInventoryPayload(getFallbackPayload());
  window.focus?.();
  focusPrimaryInput();
};

const handleSearchInput = (event) => {
  appState.filter = event.target.value || "";
  renderInventory();
};

itemForm?.addEventListener("submit", handleAddItem);
inventoryTableBody?.addEventListener("click", handleTableClick);
refreshButton?.addEventListener("click", handleRefreshClick);
resetButton?.addEventListener("click", handleResetClick);
searchField?.addEventListener("input", handleSearchInput);

listInventory();
