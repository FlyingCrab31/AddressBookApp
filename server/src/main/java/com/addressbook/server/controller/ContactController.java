package com.addressbook.server.controller;

import com.addressbook.server.model.Contact;
import com.addressbook.server.model.ContactRequest;
import com.addressbook.server.service.ContactStore;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ContactController {
    private final ContactStore store;

    public ContactController(ContactStore store) {
        this.store = store;
    }

    @GetMapping
    public List<Contact> getAll() {
        return store.findAll();
    }

    @GetMapping("/{id}")
    public Contact getById(@PathVariable String id) {
        return store.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Contact create(@RequestBody ContactRequest request) {
        return store.create(request);
    }

    @PutMapping("/{id}")
    public Contact update(@PathVariable String id, @RequestBody ContactRequest request) {
        return store.update(id, request)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        if (!store.delete(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found");
        }
    }
}
