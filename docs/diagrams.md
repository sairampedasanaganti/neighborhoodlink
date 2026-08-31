# Diagrams (Mermaid source)

## Use Case Diagram
```mermaid
graph LR
  Requester((Requester))
  Volunteer((Volunteer))
  Admin((Admin))

  Requester --> UC1[Create Help Request]
  Requester --> UC2[Track Request Progress]
  Requester --> UC3[View Volunteer Info]
  Requester --> UC4[Rate Volunteer]
  Requester --> UC5[Cancel Request]

  Volunteer --> UC6[Browse / Filter Requests]
  Volunteer --> UC7[Accept Request]
  Volunteer --> UC8[Update Task Status]
  Volunteer --> UC9[Share Live Location]
  Volunteer --> UC10[Rate Requester]

  Admin --> UC11[Approve/Reject Verification]
  Admin --> UC12[Monitor Requests]
  Admin --> UC13[Suspend Users]
  Admin --> UC14[View Platform Stats]
```

## System Architecture Diagram
```mermaid
graph TB
  subgraph Client
    A[React + Vite SPA]
  end
  subgraph Backend
    B[Express REST API]
    C[Priority Engine]
    D[Matching Engine]
    E[Notification Service]
  end
  subgraph External
    F[(MongoDB Atlas)]
    G[Firebase Authentication]
  end

  A -- REST/JSON + ID Token --> B
  A -- Sign up/Login --> G
  B -- verifyIdToken --> G
  B --> C
  B --> D
  B --> E
  B -- Mongoose --> F
```

## Request Workflow (State Diagram)
```mermaid
stateDiagram-v2
  [*] --> Pending: Request created
  Pending --> Accepted: Volunteer accepts
  Pending --> Cancelled: Requester cancels
  Accepted --> "On the Way": Volunteer updates
  Accepted --> Cancelled
  "On the Way" --> "In Progress": Volunteer updates
  "On the Way" --> Cancelled
  "In Progress" --> Completed: Volunteer marks done
  "In Progress" --> Cancelled
  Completed --> [*]
  Cancelled --> [*]
```

## ER Diagram
```mermaid
erDiagram
  USER ||--o{ HELPREQUEST : "creates (requester)"
  USER ||--o{ HELPREQUEST : "accepts (assignedVolunteer)"
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ REVIEW : "writes (reviewer)"
  USER ||--o{ REVIEW : "receives (reviewee)"
  HELPREQUEST ||--o{ REVIEW : "generates"
  HELPREQUEST ||--o{ NOTIFICATION : "relatedRequest"

  USER {
    ObjectId _id
    string firebaseUid
    string fullName
    string email
    string verificationStatus
    string role
    number ratingAverage
  }
  HELPREQUEST {
    ObjectId _id
    ObjectId requester
    ObjectId assignedVolunteer
    string category
    string priority
    string status
  }
  NOTIFICATION {
    ObjectId _id
    ObjectId user
    string type
    boolean isRead
  }
  REVIEW {
    ObjectId _id
    ObjectId request
    ObjectId reviewer
    ObjectId reviewee
    number rating
  }
```

## DFD Level 0
```mermaid
graph LR
  Requester -->|Create request| System((NeighborLink System))
  Volunteer -->|Accept / update status| System
  Admin -->|Approve / reject / monitor| System
  System -->|Notifications| Requester
  System -->|Notifications| Volunteer
  System <-->|Read/Write| DB[(MongoDB)]
  System <-->|Verify token| Auth[Firebase Auth]
```
