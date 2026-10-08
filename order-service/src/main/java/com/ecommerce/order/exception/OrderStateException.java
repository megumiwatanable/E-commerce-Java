package com.ecommerce.order.exception;

public class OrderStateException extends RuntimeException {
    private final String errorCode;

    public OrderStateException(String message) {
        super(message);
        this.errorCode = "INVALID_ORDER_STATE";
    }

    public OrderStateException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}
