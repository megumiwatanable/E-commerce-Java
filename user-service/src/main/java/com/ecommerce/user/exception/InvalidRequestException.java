package com.ecommerce.user.exception;

public class InvalidRequestException extends RuntimeException {
    private final String errorCode;

    public InvalidRequestException(String message) {
        super(message);
        this.errorCode = "INVALID_REQUEST";
    }

    public InvalidRequestException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
