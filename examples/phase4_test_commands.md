# API Forge Phase 4 기능 테스트 명령어

## 🔐 인증 기능 테스트 (Authentication)

### 1. Bearer Token 인증 설정
```
set_auth_config로 Bearer 토큰 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test" 설정해줘
```

### 2. API Key 인증 설정
```
set_auth_config로 API Key "sk-test-123456789" 설정해줘
```

### 3. Basic Auth 인증 설정
```
set_auth_config로 Basic 인증을 username "admin", password "secret123"으로 설정해줘
```

### 4. OAuth2 Client Credentials 설정
```
set_auth_config로 OAuth2 인증을 다음과 같이 설정해줘:
- type: oauth2
- clientId: "my-client-id"
- clientSecret: "my-client-secret"
- tokenUrl: "https://auth.example.com/token"
- grantType: "client_credentials"
```

### 5. 인증과 함께 API 테스트 (test_with_auth)
```
test_with_auth로 https://httpbin.org/bearer를 
Bearer 토큰 "test-token-abc123"으로 테스트해줘
```

### 6. API Key와 함께 테스트
```
test_with_auth로 https://api.example.com/protected를
API Key "api-key-12345" (헤더: X-API-Key)로 테스트하고
상태 코드가 200인지 검증해줘
```

### 7. Basic Auth와 함께 테스트
```
test_with_auth로 https://httpbin.org/basic-auth/user/pass를
Basic 인증 (username: "user", password: "pass")으로 테스트하고
다음을 검증해줘:
- 상태 코드가 200인지
- JSONPath $.authenticated가 true인지
```

### 8. OAuth2와 검증을 함께 사용
```
test_with_auth로 https://api.example.com/user/profile을
OAuth2 인증으로 테스트하고 (accessToken: "existing-token-123")
다음을 검증해줘:
- 상태 코드가 200인지
- Content-Type이 "application/json"인지
- 응답 시간이 2000ms 이하인지
```

## ⚙️ 환경 설정 관리 (Configuration Management)

### 1. 설정 파일 로드
```
load_config로 /Users/winter.e/easy-work/api-forge/examples/config.example.json 파일을 로드해줘
```

### 2. 설정 파일 로드 후 환경 설정
```
load_config로 examples/config.example.json 파일을 로드하고
"development" 환경으로 설정해줘
```

### 3. 환경 전환
```
set_environment로 "testing" 환경으로 전환해줘
```

### 4. Production 환경으로 전환
```
set_environment로 "production" 환경으로 전환해줘
```

### 5. 설정 로드 후 바로 테스트
```
1. load_config로 config.example.json 로드하고
2. set_environment로 "testing" 환경 설정한 다음
3. test_http_endpoint로 /posts 엔드포인트 테스트해줘
(baseURL이 자동으로 적용됨)
```

## 🚀 배치 테스트 (Batch Testing)

### 1. 순차적 배치 테스트
```
batch_test로 다음 테스트들을 순차적으로 실행해줘:
- name: "Get Users", url: "https://jsonplaceholder.typicode.com/users", method: "GET"
- name: "Get Posts", url: "https://jsonplaceholder.typicode.com/posts", method: "GET"
- name: "Get Comments", url: "https://jsonplaceholder.typicode.com/comments", method: "GET"
옵션: parallel: false, delayBetween: 500
```

### 2. 병렬 배치 테스트
```
batch_test로 다음 테스트들을 병렬로 실행해줘:
- name: "API 1", url: "https://httpbin.org/delay/1", method: "GET"
- name: "API 2", url: "https://httpbin.org/delay/1", method: "GET"
- name: "API 3", url: "https://httpbin.org/delay/1", method: "GET"
옵션: parallel: true, maxConcurrent: 3
```

### 3. 검증과 함께 배치 테스트
```
batch_test로 다음 테스트들을 실행해줘:
tests:
- name: "Get Post 1"
  url: "https://jsonplaceholder.typicode.com/posts/1"
  method: "GET"
  assertions:
    - type: "status", expected: 200
    - type: "bodyJsonPath", path: "$.id", expected: 1
- name: "Get Post 2"
  url: "https://jsonplaceholder.typicode.com/posts/2"
  method: "GET"
  assertions:
    - type: "status", expected: 200
    - type: "bodyJsonPath", path: "$.id", expected: 2
options:
  parallel: false
  stopOnFailure: true
```

### 4. 인증이 필요한 배치 테스트
```
batch_test로 다음 테스트들을 실행해줘:
tests:
- name: "Protected Endpoint 1"
  url: "https://httpbin.org/bearer"
  auth: { type: "bearer", token: "test-token-123" }
  assertions:
    - type: "status", expected: 200
- name: "Basic Auth Endpoint"
  url: "https://httpbin.org/basic-auth/user/pass"
  auth: { type: "basic", username: "user", password: "pass" }
  assertions:
    - type: "status", expected: 200
```

### 5. 재시도 설정과 함께 배치 테스트
```
batch_test로 다음 테스트들을 실행해줘:
tests:
- name: "Flaky API 1", url: "https://httpbin.org/status/500"
- name: "Flaky API 2", url: "https://httpbin.org/status/503"
options:
  retryOnFailure: true
  retryAttempts: 3
  timeout: 5000
```

### 6. 요약 형식으로 배치 테스트 결과 보기
```
batch_test로 5개의 API를 테스트하되 reportFormat을 "summary"로 설정해서 보여줘:
tests: [여러 테스트들...]
reportFormat: "summary"
```

### 7. 실패한 테스트만 보기
```
batch_test로 테스트 실행하고 reportFormat을 "failures"로 설정해서 
실패한 테스트만 보여줘
```

### 8. CRUD 작업 전체 배치 테스트
```
batch_test로 다음 CRUD 작업을 순차적으로 테스트해줘:
tests:
- name: "Create Post"
  url: "https://jsonplaceholder.typicode.com/posts"
  method: "POST"
  body: { title: "Test", body: "Test content", userId: 1 }
  assertions:
    - type: "status", expected: 201
- name: "Read Post"
  url: "https://jsonplaceholder.typicode.com/posts/1"
  method: "GET"
  assertions:
    - type: "status", expected: 200
- name: "Update Post"
  url: "https://jsonplaceholder.typicode.com/posts/1"
  method: "PUT"
  body: { id: 1, title: "Updated", body: "Updated content", userId: 1 }
  assertions:
    - type: "status", expected: 200
- name: "Delete Post"
  url: "https://jsonplaceholder.typicode.com/posts/1"
  method: "DELETE"
  assertions:
    - type: "status", expected: 200
options:
  parallel: false
  delayBetween: 1000
  stopOnFailure: true
```

## 🔄 통합 시나리오 (Combined Features)

### 1. 설정 로드 → 인증 설정 → 테스트
```
1. load_config로 config.example.json 로드하고 "production" 환경 설정
2. set_auth_config로 Bearer 토큰 설정
3. test_with_auth로 /api/user 엔드포인트 테스트
```

### 2. 환경별 배치 테스트
```
1. load_config로 설정 파일 로드
2. set_environment로 "development" 환경 설정
3. batch_test로 개발 환경 API들 테스트
4. set_environment로 "testing" 환경으로 전환
5. 동일한 batch_test 실행해서 테스트 환경 검증
```

### 3. 인증이 필요한 환경에서 배치 테스트
```
1. load_config로 설정 파일 로드하고 "production" 환경 설정
   (production 환경에 auth 설정이 포함되어 있음)
2. batch_test로 다음 엔드포인트들 테스트:
   - /api/users
   - /api/products
   - /api/orders
   각각 상태 코드 200 검증
```

### 4. 파일 기반 배치 테스트
```
batch_test로 examples/batch-test.example.json 파일에 정의된 
모든 테스트를 실행해줘
```

## 📊 성능 테스트 시나리오

### 1. 응답 시간 중심 배치 테스트
```
batch_test로 다음 테스트들을 병렬로 실행하고 응답 시간을 측정해줘:
- 10개의 동일한 엔드포인트를 동시에 호출
- maxConcurrent: 5
- 각 요청의 responseTime이 1000ms 이하인지 검증
```

### 2. Rate Limiting 테스트
```
batch_test로 동일한 API를 20번 호출하되:
- parallel: true
- maxConcurrent: 2
- delayBetween: 100
Rate limiting이 작동하는지 확인
```

## 🔍 디버깅 및 도움말

### 1. Phase 4 도구 목록 확인
```
다음 도구들의 사용법을 알려줘:
- set_auth_config
- test_with_auth
- load_config
- set_environment
- batch_test
```

### 2. 현재 설정 상태 확인
```
현재 로드된 설정 파일과 활성 환경을 알려줘
```

### 3. 인증 설정 상태 확인
```
현재 설정된 인증 정보의 타입을 알려줘
```