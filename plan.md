Here’s a refined version of your project description in English, structured so it can serve as a solid foundation for development planning:

---

# Project Description: **Hanbali Heritage Academy Online Coaching Platform (تراث الحنابلة)**

## Overview

The goal is to build a **simplified online coaching/course platform** for multiple students using **Next.js 15** as the framework. The platform will provide students with an easy interface to join live sessions, view schedules, access past lessons, and stay updated with news and attachments. An **admin dashboard** will allow the superadmin to manage all content.

The design will be:

* **Arabic language, left-to-right layout**.
* **Dark theme (dark blue aesthetic)**.
* **Modern UI built with Shadcn components**.
* **Convex as backend and ORM layer**.

**Important note:** Authentication (Clerk or equivalent) should be implemented **after the first UI draft** is complete.

---

## Features

### Student Page (Main User Interface)

The student-facing page will be **one main screen** with three sections plus navigation:

#### 1. Navigation Bar

* Academy logo and name: **تراث الحنابلة**.
* Profile icon that opens a modal with student details and sign-out option.

#### 2. Section One – Current Lesson

* Display the **Google Meet link** (copiable).
* Show **time left** until the next session.
* Show the **meeting password**.
* Google Meet link can be updated manually or (optionally) generated via API (if a free option is available).

#### 3. Section Two – Weekly Schedule

* A list of upcoming lessons for the week:

  * Course name.
  * Meeting time.
* Each entry is clickable and leads to a **course-specific page** with:

  * Course description.
  * Recordings/notes from old lessons.
  * Any additional resources.

#### 4. Section Three – News & Attachments

* Admin-published updates for students.
* Downloadable files or attachments.

---

## Admin Page

A separate **admin-only dashboard** for managing platform content:

* **Google Meet Management**: update manually or auto-generate.
* **Schedule Management**: create/update weekly lessons.
* **Course Pages**: upload descriptions, resources, and past lesson content.
* **News Section**: publish announcements and upload files for download.

---

## Authentication & Security

* Use **Clerk (or an alternative auth provider)**.
* Authentication will be added **after the first UI draft** is built.
* **Pre-registered users only**:

  * Students sign in (no self-signup).
  * One **superadmin account** with enhanced security (e.g., 2FA or stricter credentials).

---

## Tech Stack

* **Frontend**: Next.js 15, Shadcn UI components.
* **Backend**: Convex (data management + ORM layer).
* **Auth**: Clerk (or equivalent) for secure login.
* **Design**: Dark theme (dark blue), Arabic text, LTR layout.

---