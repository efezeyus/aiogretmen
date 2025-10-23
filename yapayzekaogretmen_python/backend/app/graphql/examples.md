# GraphQL API Kullanım Örnekleri

GraphQL endpoint: `http://localhost:8000/api/graphql`

GraphQL Playground: `http://localhost:8000/api/graphql` (tarayıcıda açın)

## Query Örnekleri

### 1. Mevcut Kullanıcı Bilgisi

```graphql
query GetMe {
  me {
    id
    username
    email
    fullName
    role
    gradeLevel
    progress {
      totalLessons
      completedLessons
      averageScore
      completionRate
    }
  }
}
```

### 2. Kullanıcı Listesi

```graphql
query GetUsers($limit: Int!, $offset: Int!) {
  users(limit: $limit, offset: $offset) {
    id
    username
    fullName
    role
    gradeLevel
    createdAt
    isActive
  }
}
```

Variables:
```json
{
  "limit": 10,
  "offset": 0
}
```

### 3. Ders Listesi (Filtreleme ile)

```graphql
query GetLessons($subject: String, $gradeLevel: Int) {
  lessons(subject: $subject, gradeLevel: $gradeLevel, limit: 20) {
    id
    title
    subject
    gradeLevel
    createdAt
    durationMinutes
    content {
      introduction
      mainContent
      summary
      resources
    }
    quiz {
      id
      title
      questionCount
      passingScore
    }
  }
}
```

Variables:
```json
{
  "subject": "matematik",
  "gradeLevel": 5
}
```

### 4. Arama

```graphql
query Search($query: String!, $type: String) {
  search(input: {
    query: $query,
    type: $type,
    limit: 10
  }) {
    id
    title
    type
    relevanceScore
    highlight
  }
}
```

Variables:
```json
{
  "query": "kesirler",
  "type": "lesson"
}
```

### 5. Sistem İstatistikleri

```graphql
query GetSystemStats {
  systemStats {
    totalUsers
    activeUsers
    totalLessons
    totalAiInteractions
    averageSatisfaction
    trendingSubjects
  }
}
```

### 6. Nested Query - Kullanıcı ve Dersleri

```graphql
query GetUserWithLessons($userId: String!) {
  user(id: $userId) {
    id
    username
    fullName
    lessons {
      id
      title
      subject
      gradeLevel
      quiz {
        questionCount
      }
    }
    progress {
      totalLessons
      completedLessons
      completionRate
    }
  }
}
```

## Mutation Örnekleri

### 1. Kullanıcı Oluşturma

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    username
    email
    fullName
    role
    gradeLevel
    createdAt
  }
}
```

Variables:
```json
{
  "input": {
    "username": "yeni_ogrenci",
    "email": "ogrenci@example.com",
    "password": "güvenli_şifre",
    "fullName": "Ahmet Yılmaz",
    "role": "student",
    "gradeLevel": 7
  }
}
```

### 2. Ders Oluşturma

```graphql
mutation CreateLesson($input: CreateLessonInput!) {
  createLesson(input: $input) {
    id
    title
    subject
    gradeLevel
    createdAt
  }
}
```

Variables:
```json
{
  "input": {
    "title": "Kesirler - Giriş",
    "subject": "matematik",
    "gradeLevel": 5,
    "content": "Kesirler konusuna giriş...",
    "durationMinutes": 45
  }
}
```

### 3. AI'ya Soru Sorma

```graphql
mutation AskAI($input: AIQuestionInput!) {
  askAi(input: $input) {
    id
    question
    response
    modelUsed
    confidence
    createdAt
  }
}
```

Variables:
```json
{
  "input": {
    "question": "Kesirler nedir ve nasıl sadeleştirilir?",
    "gradeLevel": 5,
    "subject": "matematik",
    "includeResources": true
  }
}
```

### 4. Ders İlerlemesi Güncelleme

```graphql
mutation UpdateProgress($lessonId: String!, $progress: Int!) {
  updateLessonProgress(
    lessonId: $lessonId,
    progress: $progress
  )
}
```

Variables:
```json
{
  "lessonId": "lesson_123",
  "progress": 75
}
```

## Subscription Örnekleri

### 1. Ders İlerleme Güncellemeleri

```graphql
subscription LessonProgress($userId: String!) {
  lessonProgress(userId: $userId) {
    userId
    lessonId
    progress
    timestamp
  }
}
```

### 2. Online Kullanıcılar

```graphql
subscription OnlineUsers {
  onlineUsers {
    userId
    status
    timestamp
  }
}
```

### 3. AI Streaming Yanıt

```graphql
subscription AIStream($input: AIQuestionInput!) {
  aiStream(input: $input) {
    chunk
    isFinal
    tokenCount
  }
}
```

Variables:
```json
{
  "input": {
    "question": "Fotosintez nedir?",
    "gradeLevel": 6,
    "subject": "fen"
  }
}
```

## Fragments Kullanımı

### Tekrar Kullanılabilir Fragment'ler

```graphql
fragment UserBasicInfo on User {
  id
  username
  fullName
  role
}

fragment LessonBasicInfo on Lesson {
  id
  title
  subject
  gradeLevel
}

query GetUsersWithFragment {
  users(limit: 10) {
    ...UserBasicInfo
    email
    createdAt
  }
}
```

## Batch Query Örneği

```graphql
query BatchQuery($userId: String!, $lessonId: String!) {
  # Kullanıcı bilgisi
  user(id: $userId) {
    ...UserBasicInfo
    progress {
      completionRate
    }
  }
  
  # Ders bilgisi
  lesson(id: $lessonId) {
    ...LessonBasicInfo
    quiz {
      questionCount
    }
  }
  
  # Sistem istatistikleri
  systemStats {
    totalUsers
    activeUsers
  }
}
```

## Error Handling

GraphQL hataları şu formatta döner:

```json
{
  "errors": [
    {
      "message": "User not found",
      "path": ["user"],
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ],
  "data": {
    "user": null
  }
}
```

## Authentication Header

Tüm isteklerde authentication header ekleyin:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Pagination

```graphql
query PaginatedLessons($limit: Int!, $offset: Int!) {
  lessons(limit: $limit, offset: $offset) {
    id
    title
  }
}
```

## Filtering ve Sorting

```graphql
query FilteredLessons(
  $subject: String,
  $gradeLevel: Int,
  $sortBy: String,
  $sortOrder: String
) {
  lessons(
    subject: $subject,
    gradeLevel: $gradeLevel,
    sortBy: $sortBy,
    sortOrder: $sortOrder
  ) {
    id
    title
    createdAt
  }
}
```
