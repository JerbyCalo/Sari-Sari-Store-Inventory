const inventoryTableBody = document.getElementById("inventory-body");
const itemForm = document.getElementById("item-form");
const addItemButton = document.getElementById("add-item");
const refreshButton = document.getElementById("refresh-demo");
const resetButton = document.getElementById("reset-inventory");
const searchField = document.getElementById("search");
const inventoryValueEl = document.getElementById("inventory-value");
const salesTotalEl = document.getElementById("sales-total");
const profitTotalEl = document.getElementById("profit-total");
const productNameInput = document.getElementById("product-name");
const salesReportButton = document.getElementById("sales-report-button");
// const lowStockAlert = document.getElementById("low-stock-alert");
// const lowStockMessage = document.getElementById("low-stock-message");
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
const editModal = document.getElementById("edit-modal");
const editModalForm = document.getElementById("edit-modal-form");
const editModalTitle = document.getElementById("edit-modal-title");
const editProductName = document.getElementById("edit-product-name");
const editProductPrice = document.getElementById("edit-product-price");
const editProductCostPrice = document.getElementById("edit-product-cost-price");
const editProductQuantity = document.getElementById("edit-product-quantity");
const editModalError = document.getElementById("edit-modal-error");
const editModalCancel = document.getElementById("edit-modal-cancel");
const salesModal = document.getElementById("sales-modal");
const salesHistoryList = document.getElementById("sales-history-list");
const salesModalClose = document.getElementById("sales-modal-close");

const hasInventoryBridge =
  typeof window !== "undefined" && !!window.inventoryAPI;
const fallbackInventory = [];
let fallbackSalesTotal = 0;

const appState = {
  items: [],
  filter: "",
  salesTotal: 0,
  currentEditItemId: null,
  salesHistory: [],
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
  const costPrice = Number.isFinite(Number(item.costPrice))
    ? Number.parseFloat(Number(item.costPrice).toFixed(2))
    : 0;

  if (!name) {
    return null;
  }

  return {
    id,
    name,
    price: price >= 0 ? price : 0,
    quantity: quantity >= 0 ? quantity : 0,
    costPrice: costPrice >= 0 ? costPrice : 0,
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

const calculateTotalProfit = () => {
  if (
    !Array.isArray(appState.salesHistory) ||
    appState.salesHistory.length === 0
  ) {
    return 0;
  }

  const profitTotal = appState.salesHistory.reduce((total, sale) => {
    const saleTotal = Number.parseFloat(sale?.totalAmount);
    const quantitySold = Number.parseFloat(sale?.quantitySold);
    const unitCost = Number.parseFloat(sale?.costPrice);

    const normalizedSaleTotal = Number.isFinite(saleTotal) ? saleTotal : 0;
    const normalizedQuantity = Number.isFinite(quantitySold) ? quantitySold : 0;
    const normalizedUnitCost = Number.isFinite(unitCost) ? unitCost : 0;

    const costTotal = normalizedQuantity * normalizedUnitCost;
    const profit = normalizedSaleTotal - costTotal;

    return total + profit;
  }, 0);

  return Number.parseFloat(profitTotal.toFixed(2));
};

// const checkLowStock = () => {
//   if (!lowStockAlert || !lowStockMessage) {
//     return;
//   }

//   const productCount = Array.isArray(appState.items)
//     ? appState.items.length
//     : 0;

//   if (productCount > 0 && productCount <= 3) {
//     const itemNames = appState.items.map((item) => item.name).join(", ");
//     const suffix = productCount === 1 ? "product" : "products";
//     lowStockMessage.textContent = `Low inventory alert: Only ${productCount} ${suffix} in stock — ${itemNames}`;
//     lowStockAlert.removeAttribute("hidden");
//   } else {
//     lowStockAlert.setAttribute("hidden", "");
//   }
// };

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
  const totalProfit = Number.parseFloat(calculateTotalProfit().toFixed(2));

  inventoryValueEl.textContent = formatCurrency(totalValue);
  salesTotalEl.textContent = formatCurrency(totalSales);

  if (profitTotalEl) {
    profitTotalEl.textContent = formatCurrency(totalProfit);
  }

  // checkLowStock();
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
            <button type="button" class="action-button action-button--edit" data-edit="${escapeHtml(
              item.id
            )}">Edit</button>
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
    appState.salesHistory = await window.inventoryAPI.getSalesHistory();
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
    costPrice: Number.parseFloat(formData.get("costPrice")) || 0,
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

  if (!Number.isFinite(payload.costPrice) || payload.costPrice < 0) {
    window.alert("Cost price must be zero or greater.");
    return;
  }

  payload.price = Number.parseFloat(payload.price.toFixed(2));
  payload.costPrice = Number.parseFloat(payload.costPrice.toFixed(2));

  setFormBusy(true);

  try {
    if (hasInventoryBridge) {
      const updated = await window.inventoryAPI.list();
      appState.salesHistory = await window.inventoryAPI.getSalesHistory();
      const added = await window.inventoryAPI.add(payload);
      applyInventoryPayload(added);
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

  const wantsDelete = await requestConfirmation({
    title: "Confirm Delete",
    message: `Are you sure you want to delete "${targetItem.name}"? This action cannot be undone.`,
    confirmLabel: "Delete",
  });

  if (!wantsDelete) {
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
      appState.salesHistory = await window.inventoryAPI.getSalesHistory();
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

  const totalAmount = targetItem.price * quantity;
  const wantsSell = await requestConfirmation({
    title: "Confirm Sale",
    message: `Record sale of ${quantity} x ${
      targetItem.name
    } for ${formatCurrency(totalAmount)}?`,
    confirmLabel: "Confirm Sale",
  });

  if (!wantsSell) {
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
      appState.salesHistory = await window.inventoryAPI.getSalesHistory();
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

const hideEditModal = () => {
  if (!editModal) {
    return;
  }

  editModal.classList.remove("is-open");
  setTimeout(() => {
    if (!editModal.classList.contains("is-open")) {
      editModal.setAttribute("hidden", "");
    }
  }, 160);
};

const showEditModal = (item) => {
  if (
    !editModal ||
    !editModalForm ||
    !editProductName ||
    !editProductPrice ||
    !editProductCostPrice ||
    !editProductQuantity
  ) {
    return;
  }

  appState.currentEditItemId = item.id;

  editProductName.value = item.name;
  editProductPrice.value = item.price;
  editProductCostPrice.value = item.costPrice || 0;
  editProductQuantity.value = item.quantity;

  if (editModalError) {
    editModalError.hidden = true;
  }

  editModal.removeAttribute("hidden");
  requestAnimationFrame(() => {
    editModal.classList.add("is-open");
    editProductName.focus();
  });
};

const processEdit = async (editButton) => {
  const itemId = editButton.getAttribute("data-edit");
  if (!itemId) {
    return;
  }

  const targetItem = appState.items.find((item) => item.id === itemId);
  if (!targetItem) {
    return;
  }

  showEditModal(targetItem);
};

const handleEditSubmit = async (event) => {
  event.preventDefault();

  if (!appState.currentEditItemId) {
    return;
  }

  const name = editProductName.value.trim();
  const price = Number.parseFloat(editProductPrice.value);
  const costPrice = Number.parseFloat(editProductCostPrice.value);
  const quantity = Number.parseInt(editProductQuantity.value, 10);

  if (!name) {
    if (editModalError) {
      editModalError.textContent = "Product name is required.";
      editModalError.hidden = false;
    }
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    if (editModalError) {
      editModalError.textContent = "Price must be zero or greater.";
      editModalError.hidden = false;
    }
    return;
  }

  if (!Number.isFinite(costPrice) || costPrice < 0) {
    if (editModalError) {
      editModalError.textContent = "Cost price must be zero or greater.";
      editModalError.hidden = false;
    }
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    if (editModalError) {
      editModalError.textContent =
        "Quantity must be a whole number greater than or equal to zero.";
      editModalError.hidden = false;
    }
    return;
  }

  try {
    if (hasInventoryBridge) {
      const updated = await window.inventoryAPI.update({
        id: appState.currentEditItemId,
        name,
        price,
        costPrice,
        quantity,
      });
      appState.salesHistory = await window.inventoryAPI.getSalesHistory();
      applyInventoryPayload(updated);
    } else {
      const fallbackIndex = fallbackInventory.findIndex(
        (item) => item.id === appState.currentEditItemId
      );
      if (fallbackIndex >= 0) {
        fallbackInventory[fallbackIndex] = {
          ...fallbackInventory[fallbackIndex],
          name,
          price: Number.parseFloat(price.toFixed(2)),
          costPrice: Number.parseFloat(costPrice.toFixed(2)),
          quantity,
        };
        applyInventoryPayload(getFallbackPayload());
      }
    }

    hideEditModal();
    appState.currentEditItemId = null;
  } catch (error) {
    console.error("Failed to update item", error);
    if (editModalError) {
      editModalError.textContent = "Unable to update item. Please try again.";
      editModalError.hidden = false;
    }
  }
};

const handleEditCancel = () => {
  hideEditModal();
  appState.currentEditItemId = null;
};

const hideSalesModal = () => {
  if (!salesModal) {
    return;
  }

  salesModal.classList.remove("is-open");
  setTimeout(() => {
    if (!salesModal.classList.contains("is-open")) {
      salesModal.setAttribute("hidden", "");
    }
  }, 160);
};

const showSalesModal = async () => {
  if (!salesModal || !salesHistoryList) {
    return;
  }

  salesHistoryList.innerHTML =
    '<p class="text-muted">Loading sales history...</p>';

  salesModal.removeAttribute("hidden");
  requestAnimationFrame(() => {
    salesModal.classList.add("is-open");
  });

  try {
    if (hasInventoryBridge) {
      appState.salesHistory = await window.inventoryAPI.getSalesHistory();
    }

    if (!appState.salesHistory || appState.salesHistory.length === 0) {
      salesHistoryList.innerHTML =
        '<p class="text-muted">No sales recorded yet.</p>';
      return;
    }

    const historyHtml = appState.salesHistory
      .map(
        (sale) => `
        <div class="sales-entry">
          <div class="sales-entry-header">
            <span class="sales-entry-name">${escapeHtml(sale.itemName)}</span>
            <span class="sales-entry-amount">${formatCurrency(
              sale.totalAmount
            )}</span>
          </div>
          <div class="sales-entry-details">
            <div class="sales-entry-detail">
              <span>Quantity:</span>
              <span>${escapeHtml(sale.quantitySold)}</span>
            </div>
            <div class="sales-entry-detail">
              <span>Unit Price:</span>
              <span>${formatCurrency(sale.unitPrice)}</span>
            </div>
            <div class="sales-entry-detail">
              <span>Profit:</span>
              <span>${formatCurrency(sale.profit)}</span>
            </div>
          </div>
          <div class="sales-entry-date">${escapeHtml(sale.date)}</div>
        </div>
      `
      )
      .join("");

    salesHistoryList.innerHTML = historyHtml;
  } catch (error) {
    console.error("Failed to load sales history", error);
    salesHistoryList.innerHTML =
      '<p class="text-muted">Unable to load sales history.</p>';
  }
};

const handleSalesReportClick = async () => {
  await showSalesModal();
};

const handleSalesModalClose = () => {
  hideSalesModal();
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
    return;
  }

  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    await processEdit(editButton);
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
      appState.salesHistory = [];
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
  appState.salesHistory = [];
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
editModalForm?.addEventListener("submit", handleEditSubmit);
editModalCancel?.addEventListener("click", handleEditCancel);
editModal?.addEventListener("click", (event) => {
  if (event.target === editModal) {
    handleEditCancel();
  }
});
salesReportButton?.addEventListener("click", handleSalesReportClick);
salesModalClose?.addEventListener("click", handleSalesModalClose);
salesModal?.addEventListener("click", (event) => {
  if (event.target === salesModal) {
    handleSalesModalClose();
  }
});

listInventory();
