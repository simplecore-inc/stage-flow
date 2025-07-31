---
id: examples-shopping-cart
title: Shopping Cart
sidebar_label: Shopping Cart
---

# Shopping Cart

A shopping cart with add, remove, and checkout functionality using individual stage components and StageRenderer.

## Overview

This example demonstrates a comprehensive e-commerce shopping cart with the following features:

- **Cart Management**: Add, remove, and update item quantities
- **Individual Stage Components**: Each stage is a separate React component
- **StageRenderer**: Automatic stage rendering based on current stage
- **State Persistence**: Cart items persist across stage transitions
- **Checkout Flow**: Complete checkout process with shipping information
- **Order Processing**: Simulated order processing with loading states
- **Order Completion**: Success state with order confirmation
- **Product Catalog**: Browse and add products to cart

## Key Features to Observe

1. **Individual Stage Components**: Each stage (browsing, checkout, confirmation) is a separate component
2. **StageRenderer Usage**: Automatic stage rendering without conditional rendering
3. **Cart Management**: Add, remove, and update item quantities
4. **State Persistence**: Cart items persist across stage transitions
5. **Checkout Flow**: Complete checkout process with shipping information
6. **Order Processing**: Simulated order processing with loading states
7. **Order Completion**: Success state with order confirmation
8. **Product Catalog**: Browse and add products to cart

## Live Example

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function ShoppingCart() {
  // Common UI Components
  function FormContainer({ children, title = "Shopping Cart" }) {
    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          maxWidth: "800px",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>{title}</h2>
        {children}
      </div>
    );
  }

  function FormButton({ onClick, children, variant = "primary", disabled = false, style = {} }) {
    const buttonStyles = {
      primary: {
        backgroundColor: "#007bff",
        color: "white",
      },
      secondary: {
        backgroundColor: "#6c757d",
        color: "white",
      },
      success: {
        backgroundColor: "#28a745",
        color: "white",
      },
      danger: {
        backgroundColor: "#dc3545",
        color: "white",
      },
    };

    const buttonStyle = {
      padding: "10px 20px",
      border: "none",
      borderRadius: "4px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "14px",
      fontWeight: "500",
      opacity: disabled ? 0.6 : 1,
      ...buttonStyles[variant],
      ...style,
    };

    return (
      <button onClick={onClick} style={buttonStyle} disabled={disabled}>
        {children}
      </button>
    );
  }

  function FormInput({ type = "text", placeholder, value, onChange, style = {} }) {
    const inputStyle = {
      padding: "10px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      width: "100%",
      marginBottom: "10px",
      color: "#2c3e50",
      fontSize: "14px",
      backgroundColor: "white",
      ...style,
    };

    return (
      <input
        type={type}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        style={inputStyle}
      />
    );
  }

  function ProductCard({ product, onAddToCart }) {
    return (
      <div
        style={{
          border: "1px solid #ddd",
          padding: "15px",
          borderRadius: "4px",
          textAlign: "center",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>{product.name}</h4>
        <p
          style={{
            color: "#007bff",
            fontWeight: "bold",
            margin: "0 0 10px 0",
          }}
        >
          ${product.price}
        </p>
        <FormButton onClick={() => onAddToCart(product)} variant="success">
          Add to Cart
        </FormButton>
      </div>
    );
  }

  function CartItem({ item, onUpdateQuantity, onRemoveItem }) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px",
          border: "1px solid #eee",
          marginBottom: "10px",
          borderRadius: "4px",
          backgroundColor: "white",
        }}
      >
        <span style={{ color: "#2c3e50", fontWeight: "500" }}>{item.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FormButton
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            variant="danger"
            style={{ padding: "4px 8px" }}
          >
            -
          </FormButton>
          <span style={{ color: "#2c3e50", fontWeight: "500", minWidth: "20px", textAlign: "center" }}>
            {item.quantity}
          </span>
          <FormButton
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            variant="success"
            style={{ padding: "4px 8px" }}
          >
            +
          </FormButton>
          <span style={{ color: "#2c3e50", fontWeight: "500", minWidth: "60px", textAlign: "right" }}>
            ${item.price * item.quantity}
          </span>
        </div>
      </div>
    );
  }

  function DebugInfo() {
    const { currentStage, data, send } = useStageFlow();
    const [editStage, setEditStage] = React.useState(currentStage);
    const [editData, setEditData] = React.useState(JSON.stringify(data, null, 2));
    const [isEditing, setIsEditing] = React.useState(false);

    // Update edit state when actual state changes
    React.useEffect(() => {
      if (!isEditing) {
        setEditStage(currentStage);
        setEditData(JSON.stringify(data, null, 2));
      }
    }, [currentStage, data, isEditing]);

    const handleStageChange = React.useCallback((e) => {
      setEditStage(e.target.value);
    }, []);

    const handleDataChange = React.useCallback((e) => {
      setEditData(e.target.value);
    }, []);

    const handleApplyChanges = React.useCallback(() => {
      try {
        const parsedData = JSON.parse(editData);
        send("updateData", parsedData);
        setIsEditing(false);
      } catch (error) {
        alert("Invalid JSON data");
      }
    }, [editData, send]);

    const handleReset = React.useCallback(() => {
      setEditStage(currentStage);
      setEditData(JSON.stringify(data, null, 2));
      setIsEditing(false);
    }, [currentStage, data]);

    return (
      <div style={{ 
        marginBottom: "20px", 
        padding: "15px", 
        backgroundColor: "#f8f9fa", 
        borderRadius: "4px", 
        border: "1px solid #e9ecef",
        maxWidth: "800px",
        width: "100%"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h4 style={{ margin: "0", color: "#495057" }}>Debug Info:</h4>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: "5px 10px",
              backgroundColor: isEditing ? "#dc3545" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "3px",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        {isEditing ? (
          <div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#495057", marginBottom: "5px" }}>
                <strong>Current Stage:</strong>
              </label>
              <select
                value={editStage}
                onChange={handleStageChange}
                style={{
                  padding: "5px",
                  fontSize: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                  width: "100%"
                }}
              >
                <option value="browsing">browsing</option>
                <option value="checkout">checkout</option>
                <option value="confirmation">confirmation</option>
              </select>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#495057", marginBottom: "5px" }}>
                <strong>Current Data (JSON):</strong>
              </label>
              <textarea
                value={editData}
                onChange={handleDataChange}
                style={{
                  padding: "5px",
                  fontSize: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                  width: "100%",
                  height: "100px",
                  fontFamily: "monospace"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleApplyChanges}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Apply
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
              <strong>Current Stage:</strong> {currentStage}
            </p>
            <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
              <strong>Stage Components:</strong> browsing, checkout, confirmation
            </p>
            <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
              <strong>Current Data:</strong> {JSON.stringify(data)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Browsing stage component
  function BrowsingStage({ data, send }) {
    const products = [
      { id: 1, name: "Laptop", price: 999 },
      { id: 2, name: "Mouse", price: 25 },
      { id: 3, name: "Keyboard", price: 75 },
    ];

    const addToCart = React.useCallback((product) => {
      const existingItem = data?.items?.find(item => item.id === product.id);
      let updatedItems;

      if (existingItem) {
        updatedItems = data.items.map(item => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
        updatedItems = [...(data?.items || []), { ...product, quantity: 1 }];
      }

      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      send("addItem", {
        ...(data || {}),
        items: updatedItems,
        total,
      });
    }, [data, send]);

    const removeFromCart = React.useCallback((productId) => {
      const updatedItems = data?.items?.filter(item => item.id !== productId);
      const total = updatedItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
      send("removeItem", {
        ...(data || {}),
        items: updatedItems,
        total,
      });
    }, [data, send]);

    const updateQuantity = React.useCallback((productId, quantity) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      const updatedItems = data?.items?.map(item => (item.id === productId ? { ...item, quantity } : item));
      const total = updatedItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
      send("updateQuantity", {
        ...(data || {}),
        items: updatedItems,
        total,
      });
    }, [data, send, removeFromCart]);

    return (
      <FormContainer>
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Products</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
            }}
          >
            {products.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        </div>

        {data?.items && data.items.length > 0 ? (
          <div>
            <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Cart Items</h3>
            {data.items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
              />
            ))}
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <strong style={{ color: "#2c3e50" }}>Total:</strong>
                <strong style={{ color: "#2c3e50" }}>${data.total}</strong>
              </div>
              <FormButton
                onClick={() => send("proceedToCheckout", { ...(data || {}) })}
                style={{ width: "100%", fontSize: "16px" }}
              >
                Proceed to Checkout
              </FormButton>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#6c757d" }}>Your cart is empty</h3>
            <p style={{ color: "#6c757d" }}>Add some items to get started!</p>
          </div>
        )}
      </FormContainer>
    );
  }

  // Checkout stage component
  function CheckoutStage({ data, send }) {
    const updateShippingInfo = React.useCallback((field, value) => {
      send("updateShipping", { ...data, [field]: value });
    }, [data, send]);

    const calculateShipping = React.useCallback(() => {
      if (data?.total > 100) return 0; // Free shipping for orders over $100

      switch (data?.shippingMethod) {
        case "express":
          return 15;
        case "overnight":
          return 25;
        default:
          return 5; // standard
      }
    }, [data?.total, data?.shippingMethod]);

    const getTotalWithShipping = React.useCallback(() => {
      return (data?.total || 0) + calculateShipping();
    }, [data?.total, calculateShipping]);

    return (
      <FormContainer>
        <h3 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>Checkout</h3>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>Order Summary</h4>
          {data?.items && data.items.length > 0 ? (
            <>
              {data.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    color: "#2c3e50",
                  }}
                >
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>${item.price * item.quantity}</span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid #eee",
                  paddingTop: "10px",
                  marginTop: "10px",
                  fontWeight: "bold",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#2c3e50" }}>
                  <span>Subtotal:</span>
                  <span>${data?.total || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#2c3e50" }}>
                  <span>Shipping:</span>
                  <span>${calculateShipping()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#2c3e50", fontSize: "16px" }}>
                  <span>
                    <strong>Total:</strong>
                  </span>
                  <span>
                    <strong>${getTotalWithShipping()}</strong>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: "#6c757d", textAlign: "center", padding: "20px" }}>No items in cart</div>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>Shipping Information</h4>
          <FormInput
            placeholder="Shipping Address"
            value={data?.shippingAddress || ""}
            onChange={e => updateShippingInfo("shippingAddress", e.target.value)}
          />
          <select
            value={data?.shippingMethod || "standard"}
            onChange={e => updateShippingInfo("shippingMethod", e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              width: "100%",
              backgroundColor: "white",
              color: "#2c3e50",
              fontSize: "14px",
            }}
          >
            <option value="standard">Standard Shipping (3-5 days) - $5</option>
            <option value="express">Express Shipping (1-2 days) - $15</option>
            <option value="overnight">Overnight Shipping - $25</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <FormButton onClick={() => send("backToBrowsing")} variant="secondary">
            Back to Cart
          </FormButton>
          <FormButton onClick={() => send("placeOrder", { ...(data || {}) })} variant="success" style={{ flex: 1 }}>
            Place Order
          </FormButton>
        </div>
      </FormContainer>
    );
  }

  // Confirmation stage component
  function ConfirmationStage({ data, send }) {
    const calculateShipping = React.useCallback(() => {
      if (data?.total > 100) return 0;
      switch (data?.shippingMethod) {
        case "express": return 15;
        case "overnight": return 25;
        default: return 5;
      }
    }, [data?.total, data?.shippingMethod]);

    const getTotalWithShipping = React.useCallback(() => {
      return (data?.total || 0) + calculateShipping();
    }, [data?.total, calculateShipping]);

    return (
      <FormContainer>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#28a745" }}>Order Complete!</h3>
          <p style={{ color: "#666", marginBottom: "20px" }}>Thank you for your order. Your items will be shipped to:</p>
          <p style={{ color: "#333", marginBottom: "20px", fontWeight: "bold" }}>{data?.shippingAddress || "No address provided"}</p>
          <p style={{ color: "#666", marginBottom: "20px" }}>Shipping method: {data?.shippingMethod || "Standard"}</p>
          <p style={{ color: "#666", marginBottom: "20px" }}>Total paid: ${getTotalWithShipping()}</p>
          <FormButton
            onClick={() =>
              send("continueShopping", {
                items: [],
                shippingAddress: "",
                shippingMethod: "standard",
                total: 0,
              })
            }
          >
            Start New Order
          </FormButton>
        </div>
      </FormContainer>
    );
  }

  // Create engine directly without useRef
  const engine = new StageFlowEngine({
    initial: "browsing",
    data: {
      items: [],
      shippingAddress: "",
      shippingMethod: "standard",
      total: 0,
    },
    stages: [
      {
        name: "browsing",
        transitions: [
          { target: "checkout", event: "proceedToCheckout" },
          { target: "browsing", event: "addItem" },
          { target: "browsing", event: "removeItem" },
          { target: "browsing", event: "updateQuantity" },
        ],
      },
      {
        name: "checkout",
        transitions: [
          { target: "confirmation", event: "placeOrder" },
          { target: "browsing", event: "backToBrowsing" },
          { target: "checkout", event: "updateShipping" },
        ],
      },
      {
        name: "confirmation",
        transitions: [{ target: "browsing", event: "continueShopping" }],
      },
    ],
  });
  engine.start();

  return (
    <StageFlowProvider engine={engine}>
      <DebugInfo />
      <StageRenderer
        currentStage="browsing"
        stageComponents={{
          browsing: BrowsingStage,
          checkout: CheckoutStage,
          confirmation: ConfirmationStage,
        }}
        data={{
          items: [],
          shippingAddress: "",
          shippingMethod: "standard",
          total: 0,
        }}
        send={(event, data) => {
          if (event === "proceedToCheckout") {
            engine.send("proceedToCheckout", data);
          } else if (event === "addItem") {
            engine.send("addItem", data);
          } else if (event === "removeItem") {
            engine.send("removeItem", data);
          } else if (event === "updateQuantity") {
            engine.send("updateQuantity", data);
          } else if (event === "placeOrder") {
            engine.send("placeOrder", data);
          } else if (event === "backToBrowsing") {
            engine.send("backToBrowsing", data);
          } else if (event === "updateShipping") {
            engine.send("updateShipping", data);
          } else if (event === "continueShopping") {
            engine.send("continueShopping", data);
          } else if (event === "updateData") {
            engine.send("updateData", data);
          }
        }}
      />
    </StageFlowProvider>
  );
}
```

## Debug Interface Techniques

The debug interface demonstrates several advanced React and Stage Flow techniques:

### 1. **Real-time State Monitoring**
- Uses `useStageFlow()` hook to access current stage and data
- Automatically updates when engine state changes
- Provides live feedback of form state without manual refresh

### 2. **Conditional State Synchronization**
```jsx
React.useEffect(() => {
  if (!isEditing) {
    setEditStage(currentStage);
    setEditData(JSON.stringify(data, null, 2));
  }
}, [currentStage, data, isEditing]);
```
- Only updates local state when not in editing mode
- Prevents user input from being overwritten during editing
- Maintains data consistency between debug panel and actual form state

### 3. **Interactive State Manipulation**
- **Stage Selection**: Dropdown to change current stage programmatically
- **Data Editing**: JSON textarea for direct data manipulation
- **Apply/Reset**: Buttons to apply changes or revert to current state
- **Error Handling**: JSON validation with user feedback

### 4. **Dual Mode Interface**
- **View Mode**: Read-only display of current state
- **Edit Mode**: Interactive controls for state manipulation
- **Toggle Control**: Single button to switch between modes

### 5. **State Management Patterns**
- **Controlled Components**: Form inputs bound to React state
- **Callback Optimization**: `useCallback` for event handlers
- **Error Boundaries**: Try-catch for JSON parsing validation
- **State Isolation**: Local edit state separate from global engine state

### 6. **Developer Experience Features**
- **Visual Feedback**: Color-coded buttons and status indicators
- **Data Formatting**: Pretty-printed JSON for readability
- **Responsive Design**: Consistent styling with main form
- **Accessibility**: Proper labels and semantic HTML structure

This debug interface serves as a powerful development tool, allowing developers to:
- Monitor form state in real-time
- Test different data scenarios quickly
- Debug state transitions and data flow
- Validate form behavior with various inputs
- Understand the relationship between UI actions and state changes
