# Debsoc Backend API Testing Guide

## Prerequisites
1. Server is running on `http://localhost:3000`
2. Database is connected and migrations are applied
3. Postman is installed

## Import Collection
Import the `Debsoc_API_Collection.postman_collection.json` file into Postman.

## Testing Flow

### Step 1: Create TechHead (Manual Database Entry)
Since TechHead doesn't have a register endpoint, you need to create one manually in the database:

```sql
INSERT INTO "TechHead" (id, name, email, password, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Tech Admin',
  'techhead@debsoc.com',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash 'techhead123'
  NOW(),
  NOW()
);
```

Or use this Node.js script to generate the hash:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('techhead123', 10).then(hash => console.log(hash));
```

### Step 2: Register Users

#### 2.1 Register President
**Endpoint:** `POST /api/president/register`
```json
{
  "name": "John President",
  "email": "president@debsoc.com",
  "password": "president123"
}
```
**Save:** Copy the `user.id` from response as `{{president_id}}`

#### 2.2 Register Cabinet
**Endpoint:** `POST /api/cabinet/register`
```json
{
  "name": "Jane Cabinet",
  "email": "cabinet@debsoc.com",
  "password": "cabinet123",
  "position": "Secretary"
}
```
**Save:** Copy the `user.id` from response as `{{cabinet_id}}`

#### 2.3 Register Member
**Endpoint:** `POST /api/member/register`
```json
{
  "name": "Alice Member",
  "email": "member@debsoc.com",
  "password": "member123"
}
```
**Save:** Copy the `user.id` from response as `{{member_id}}`

### Step 3: Login TechHead
**Endpoint:** `POST /api/techhead/login`
```json
{
  "email": "techhead@debsoc.com",
  "password": "techhead123"
}
```
**Save:** Copy the `token` from response as `{{techhead_token}}`

### Step 4: Verify Users (TechHead)

#### 4.1 Get Unverified Users
**Endpoint:** `GET /api/techhead/unverified-users`
**Headers:** `Authorization: Bearer {{techhead_token}}`

#### 4.2 Verify President
**Endpoint:** `POST /api/techhead/verify/president`
**Headers:** `Authorization: Bearer {{techhead_token}}`
```json
{
  "presidentId": "{{president_id}}"
}
```

#### 4.3 Verify Cabinet
**Endpoint:** `POST /api/techhead/verify/cabinet`
**Headers:** `Authorization: Bearer {{techhead_token}}`
```json
{
  "cabinetId": "{{cabinet_id}}"
}
```

#### 4.4 Verify Member
**Endpoint:** `POST /api/techhead/verify/member`
**Headers:** `Authorization: Bearer {{techhead_token}}`
```json
{
  "memberId": "{{member_id}}"
}
```

### Step 5: Login Verified Users

#### 5.1 Login President
**Endpoint:** `POST /api/president/login`
```json
{
  "email": "president@debsoc.com",
  "password": "president123"
}
```
**Save:** Copy the `token` as `{{president_token}}`

#### 5.2 Login Cabinet
**Endpoint:** `POST /api/cabinet/login`
```json
{
  "email": "cabinet@debsoc.com",
  "password": "cabinet123"
}
```
**Save:** Copy the `token` as `{{cabinet_token}}`

#### 5.3 Login Member
**Endpoint:** `POST /api/member/login`
```json
{
  "email": "member@debsoc.com",
  "password": "member123"
}
```
**Save:** Copy the `token` as `{{member_token}}`

### Step 6: Test President Features

#### 6.1 Assign Task to Member
**Endpoint:** `POST /api/president/tasks/assign`
**Headers:** `Authorization: Bearer {{president_token}}`
```json
{
  "name": "Prepare debate motion",
  "description": "Research and prepare the motion for next week's debate",
  "deadline": "2025-11-30T18:00:00Z",
  "assignedToMemberId": "{{member_id}}"
}
```

#### 6.2 Give Feedback to Member
**Endpoint:** `POST /api/president/feedback/give`
**Headers:** `Authorization: Bearer {{president_token}}`
```json
{
  "feedback": "Great performance in the last debate session!",
  "memberId": "{{member_id}}"
}
```

#### 6.3 Get Session Reports
**Endpoint:** `GET /api/president/sessions`
**Headers:** `Authorization: Bearer {{president_token}}`

#### 6.4 Get Dashboard Data
**Endpoint:** `GET /api/president/dashboard`
**Headers:** `Authorization: Bearer {{president_token}}`

### Step 7: Test Cabinet Features

#### 7.1 Mark Attendance
**Endpoint:** `POST /api/cabinet/attendance/mark`
**Headers:** `Authorization: Bearer {{cabinet_token}}`
```json
{
  "sessionDate": "2025-11-23T14:00:00Z",
  "motiontype": "Parliamentary Debate",
  "Chair": "John Doe",
  "attendanceData": [
    {"memberId": "{{member_id}}", "status": "Present"}
  ]
}
```

#### 7.2 Get Assigned Tasks
**Endpoint:** `GET /api/cabinet/tasks`
**Headers:** `Authorization: Bearer {{cabinet_token}}`

#### 7.3 Give Feedback to Member
**Endpoint:** `POST /api/cabinet/feedback/give`
**Headers:** `Authorization: Bearer {{cabinet_token}}`
```json
{
  "feedback": "Good participation in the session!",
  "memberId": "{{member_id}}"
}
```

#### 7.4 Send Anonymous Message to President
**Endpoint:** `POST /api/cabinet/messages/president`
**Headers:** `Authorization: Bearer {{cabinet_token}}`
```json
{
  "message": "We need more resources for the upcoming event",
  "presidentId": "{{president_id}}"
}
```

#### 7.5 Get Session Reports
**Endpoint:** `GET /api/cabinet/sessions`
**Headers:** `Authorization: Bearer {{cabinet_token}}`

### Step 8: Test Member Features

#### 8.1 Get My Attendance
**Endpoint:** `GET /api/member/attendance`
**Headers:** `Authorization: Bearer {{member_token}}`

#### 8.2 Get Assigned Tasks
**Endpoint:** `GET /api/member/tasks`
**Headers:** `Authorization: Bearer {{member_token}}`

#### 8.3 Send Anonymous Message to President
**Endpoint:** `POST /api/member/messages/president`
**Headers:** `Authorization: Bearer {{member_token}}`
```json
{
  "message": "I have a suggestion for the next debate topic",
  "presidentId": "{{president_id}}"
}
```

#### 8.4 Get My Feedback
**Endpoint:** `GET /api/member/feedback`
**Headers:** `Authorization: Bearer {{member_token}}`

## Expected Results

### Authentication Tests
- ✅ All register endpoints should return 201 with token and user data
- ✅ All login endpoints should return 200 with token and user data
- ✅ Invalid credentials should return 401
- ✅ Missing fields should return 400

### Authorization Tests
- ✅ Accessing protected routes without token should return 401
- ✅ Accessing routes with wrong role should return 403
- ✅ Unverified users accessing protected routes should return 403

### Functionality Tests
- ✅ TechHead can verify all user types
- ✅ President can assign tasks and give feedback
- ✅ Cabinet can mark attendance and send messages
- ✅ Member can view their data and send messages
- ✅ All GET endpoints return appropriate data
- ✅ All POST endpoints create data correctly

## Common Issues

### Issue: "Unauthorized: No token provided"
**Solution:** Make sure you're including the Authorization header with Bearer token

### Issue: "Forbidden: Account not verified"
**Solution:** Use TechHead to verify the user first

### Issue: "Forbidden: You do not have access to this resource"
**Solution:** Check that you're using the correct role's token for the endpoint

### Issue: Database connection error
**Solution:** Check your .env file has correct DATABASE_URL

## Postman Variables Setup
Create these environment variables in Postman:
- `techhead_token`
- `president_token`
- `president_id`
- `cabinet_token`
- `cabinet_id`
- `member_token`
- `member_id`
