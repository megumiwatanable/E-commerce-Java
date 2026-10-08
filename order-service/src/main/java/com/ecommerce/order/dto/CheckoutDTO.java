package com.ecommerce.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public class CheckoutDTO {

    public static class PlaceOrderRequest {
        @NotBlank private String idempotencyKey;
        @NotBlank @Email private String email;
        @Pattern(regexp = "^[0-9+() -]{8,30}$") private String phone;
        @Valid @NotNull private Address shippingAddress;
        @Valid @NotNull private Address billingAddress;
        @NotBlank private String paymentMethod;
        @Valid @NotEmpty private List<Item> items;

        public String getIdempotencyKey() { return idempotencyKey; }
        public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public Address getShippingAddress() { return shippingAddress; }
        public void setShippingAddress(Address shippingAddress) { this.shippingAddress = shippingAddress; }
        public Address getBillingAddress() { return billingAddress; }
        public void setBillingAddress(Address billingAddress) { this.billingAddress = billingAddress; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public List<Item> getItems() { return items; }
        public void setItems(List<Item> items) { this.items = items; }
    }

    public static class Address {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank private String street;
        @NotBlank private String city;
        @NotBlank private String state;
        @NotBlank private String postalCode;
        @NotBlank private String country;

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getStreet() { return street; }
        public void setStreet(String street) { this.street = street; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getPostalCode() { return postalCode; }
        public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }

        public String formatted() {
            return firstName + " " + lastName + ", " + street + ", " + city + ", "
                    + state + " " + postalCode + ", " + country;
        }
    }

    public static class Item {
        @NotNull private Long productId;
        @NotNull @Min(1) private Integer quantity;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    public record PlaceOrderResponse(OrderDTO order, String guestOrderToken, String paymentReference) {}
}
