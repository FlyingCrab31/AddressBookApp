package com.addressbook.server.model;

public record ContactRequest(
        String firstName,
        String lastName,
        String address,
        String city,
        String state,
        String zip,
        String phone,
        String email
) {
}
