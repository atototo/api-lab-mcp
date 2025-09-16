# API Forge 테스트 요청 예제

Claude Desktop에서 API Forge를 사용하는 다양한 예제입니다.

## 기본 요청

### GET 요청
```
test_http_endpoint 도구를 사용해서 https://httpbin.org/get 테스트해줘
```

### POST 요청
```
test_http_endpoint로 https://httpbin.org/post에 POST 요청 보내줘
본문: {"message": "Hello API Forge"}
```

### PUT 요청
```
https://httpbin.org/put에 PUT 요청 테스트
본문: {"id": 1, "name": "Updated Item"}
```

### DELETE 요청
```
https://httpbin.org/delete/123 DELETE 요청 테스트
```

## 헤더가 포함된 요청

### 사용자 정의 헤더
```
test_http_endpoint로 https://httpbin.org/headers 테스트
헤더: {"X-Custom-Header": "MyValue", "Accept": "application/json"}
```

## 인증이 필요한 요청

### Bearer 토큰
```
https://httpbin.org/bearer를 테스트해줘
인증: Bearer 토큰 "my-secret-token"
```

### API 키
```
https://api.example.com/data 테스트
인증: API 키 "my-api-key" (헤더: X-API-Key)
```

### Basic 인증
```
https://httpbin.org/basic-auth/user/pass 테스트
인증: Basic (사용자명: user, 비밀번호: pass)
```

## 복잡한 요청

### 모든 옵션 포함
```
test_http_endpoint 도구로 다음 요청 실행:
- URL: https://httpbin.org/anything
- 메소드: POST
- 헤더: {"Content-Type": "application/json", "X-Request-ID": "12345"}
- 본문: {"user": "test", "action": "create", "data": {"key": "value"}}
- 타임아웃: 10000
```

## 실제 API 테스트

### GitHub API
```
GitHub API 테스트: GET https://api.github.com/users/octocat
```

### JSONPlaceholder
```
https://jsonplaceholder.typicode.com/posts/1 GET 요청 테스트
```

### 새 게시물 생성
```
https://jsonplaceholder.typicode.com/posts에 POST 요청
본문: {"title": "Test Post", "body": "This is a test", "userId": 1}
```

## 성능 테스트

### 응답 시간 확인
```
https://httpbin.org/delay/2 테스트해서 응답 시간 확인
```

### 큰 응답 처리
```
https://httpbin.org/bytes/10000 테스트해서 응답 크기 확인
```

## 오류 처리

### 404 오류
```
https://httpbin.org/status/404 테스트
```

### 500 서버 오류
```
https://httpbin.org/status/500 테스트
```

### 타임아웃
```
https://httpbin.org/delay/35 테스트 (타임아웃: 5000ms)
```

## 디버깅

### 요청 세부 정보 확인
```
https://httpbin.org/anything에 POST 요청 보내고 전체 요청/응답 정보 보여줘
```

### 리다이렉트 추적
```
https://httpbin.org/redirect/3 테스트 (3번 리다이렉트)
```