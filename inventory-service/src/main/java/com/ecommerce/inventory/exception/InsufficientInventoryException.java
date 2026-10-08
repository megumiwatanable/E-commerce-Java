package com.ecommerce.inventory.exception;

public class InsufficientInventoryException extends RuntimeException {
    private final String errorCode;

    public InsufficientInventoryException(String message) {
        super(message);
        this.errorCode = "INSUFFICIENT_STOCK";
    }

    public InsufficientInventoryException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}
