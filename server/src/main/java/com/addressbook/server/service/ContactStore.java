package com.addressbook.server.service;

import com.addressbook.server.model.Contact;
import com.addressbook.server.model.ContactRequest;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ContactStore {
    private final ConcurrentHashMap<String, Contact> contacts = new ConcurrentHashMap<>();

    public List<Contact> findAll() {
        return contacts.values().stream()
                .sorted(Comparator.comparing(Contact::lastName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(Contact::firstName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public Contact create(ContactRequest request) {
        String id = UUID.randomUUID().toString();
        Contact contact = toContact(id, request);
        contacts.put(id, contact);
        return contact;
    }

    public Optional<Contact> update(String id, ContactRequest request) {
        if (!contacts.containsKey(id)) {
            return Optional.empty();
        }
        Contact updated = toContact(id, request);
        contacts.put(id, updated);
        return Optional.of(updated);
    }
    public Optional<Contact> findById(String id) {
        return Optional.ofNullable(contacts.get(id));
    }

    public boolean delete(String id) {
        return contacts.remove(id) != null;
    }

    private Contact toContact(String id, ContactRequest request) {
        return new Contact(
                id,
                request.firstName(),
                request.lastName(),
                request.address(),
                request.city(),
                request.state(),
                request.zip(),
                request.phone(),
                request.email()
        );
    }
}
