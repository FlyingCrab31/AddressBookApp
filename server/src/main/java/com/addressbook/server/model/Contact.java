package com.addressbook.server.model;

public record Contact(
        String id,
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
