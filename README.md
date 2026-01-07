Senior Fullstack Developer – Technical Test Case
##Case Title

Document Management System (DMS) – Mini Fullstack Platform

##Objective

Build a small fullstack application that allows users to:

Register & login

Upload documents

View, search, replace, and delete documents

Request permission before replacing/deleting

Receive notifications

This simulates a real enterprise system (API, database, auth, UI, and workflow).

##Tech Stack (example – can be flexible)

Backend

Node.js (NestJS / Express) or Python (FastAPI / Django)

REST API

JWT authentication

MySQL or PostgreSQL

Optional: Redis, S3/MinIO, Docker

Frontend

React / Next.js / Vue

Clean UI, form validation, API integration

#Core Features
1. Authentication

Register

Login

JWT protected APIs

Role support: USER, ADMIN

2. Document Management

Upload document

List documents (pagination + search)

View document detail

Replace document

Delete document

Document fields:

id
title
description
documentType
fileUrl
version
status (ACTIVE, PENDING_DELETE, PENDING_REPLACE)
createdBy
createdAt

3. Permission Workflow

When user wants to:

Replace document

Delete document

System must:

Create permission request

Notify admin

Lock the document until approved

Admin can:

Approve

Reject

4. Notification System

Store notifications in DB

Show list of notifications in UI

Mark as read

5. Frontend Requirements

Login page

Dashboard

Document list + search + filter

Upload modal/form

Replace/Delete with confirmation

Admin approval page

#Mandatory Test Scenarios
Backend

1. JWT middleware

2. Role-based access

3. Validation & error handling

4. Pagination & filtering

5. Transaction-safe replace/delete

6 Clean architecture (service, repo, controller)

Frontend

1. Auth guard

2. API error handling

3. Responsive layout

4. Reusable components

5 Loading & empty states

##System Design Questions (must be answered)

How to handle large file uploads?

How to avoid lost updates when replacing documents?

How to design notification system for scalability?

How to secure file access?

How to structure services for microservice migration?
