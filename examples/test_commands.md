# API Forge 테스트 명령어 모음

## 기본 HTTP 테스트 (test_http_endpoint)

### 1. 간단한 GET 요청
```
test_http_endpoint 도구로 https://httpbin.org/get 테스트해줘
```

### 2. Headers 포함 GET 요청
```
test_http_endpoint로 https://httpbin.org/headers를 
헤더 {"X-Custom-Header": "test-value"} 포함해서 테스트해줘
```

### 3. POST 요청
```
test_http_endpoint로 https://httpbin.org/post에 
{"name": "John", "age": 30} 본문으로 POST 요청 보내줘
```

### 4. 인증이 필요한 요청
```
test_http_endpoint로 https://httpbin.org/bearer를
Bearer 토큰 "test-token-123"으로 테스트해줘
```

## 검증 기능 테스트 (test_with_assertions)

### 1. 상태 코드 검증
```
test_with_assertions로 https://httpbin.org/status/201 테스트하고
상태 코드가 201인지 검증해줘
```

### 2. 응답 시간 검증
```
test_with_assertions로 https://httpbin.org/delay/1 테스트하고
응답 시간이 2000ms 이하인지 확인해줘
```

### 3. 헤더 검증
```
test_with_assertions로 https://httpbin.org/response-headers?Content-Type=application/json 테스트하고
Content-Type 헤더가 "application/json"을 포함하는지 검증해줘
```

### 4. 본문 내용 검증
```
test_with_assertions로 https://httpbin.org/html 테스트하고
응답 본문에 "Herman Melville"이 포함되어 있는지 확인해줘
```

### 5. JSONPath 검증
```
test_with_assertions로 https://httpbin.org/json 테스트하고
다음 검증을 수행해줘:
- JSONPath $.slideshow.title이 "Sample Slide Show"인지
- JSONPath $.slideshow.slides[0].title이 "Wake up to WonderWidgets!"인지
```

### 6. 복합 검증 (여러 assertion 동시)
```
test_with_assertions로 https://httpbin.org/post에 
{"test": "data", "number": 123} 본문으로 POST 요청 보내고
다음 검증을 모두 수행해줘:
- 상태 코드가 200인지
- Content-Type이 "application/json"을 포함하는지
- 응답 시간이 3000ms 이하인지
- JSONPath $.json.test가 "data"인지
- JSONPath $.json.number가 123인지
```

### 7. 정규식 매칭 검증
```
test_with_assertions로 https://httpbin.org/uuid 테스트하고
응답 본문이 UUID 패턴 ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})과 일치하는지 검증해줘
```

### 8. 부정 검증 (notContains)
```
test_with_assertions로 https://httpbin.org/html 테스트하고
응답 본문에 "error"가 포함되어 있지 않은지 확인해줘
```

## 재시도 기능 테스트

### 1. 재시도 설정과 함께 요청
```
test_with_assertions로 https://httpbin.org/status/500 테스트할 때
retryAttempts를 3으로, retryDelay를 1000ms로 설정해서 보내줘
```

## 실제 API 테스트 예제

### 1. GitHub API 테스트
```
test_with_assertions로 https://api.github.com/users/github 테스트하고
다음을 검증해줘:
- 상태 코드가 200인지
- JSONPath $.login이 "github"인지
- JSONPath $.type이 "Organization"인지
```

### 2. JSONPlaceholder API 테스트
```
test_with_assertions로 https://jsonplaceholder.typicode.com/posts/1 테스트하고
다음을 검증해줘:
- 상태 코드가 200인지
- JSONPath $.userId가 1인지
- JSONPath $.id가 1인지
- 응답 본문에 "sunt aut facere"가 포함되어 있는지
```

## 디버깅용 명령어

### 1. 사용 가능한 도구 확인
```
어떤 API 테스트 도구들을 사용할 수 있어?
```

### 2. 도구 파라미터 확인
```
test_with_assertions 도구의 파라미터들을 자세히 설명해줘
```

### 3. 검증 타입 확인
```
test_with_assertions에서 사용할 수 있는 assertion 타입들을 모두 알려줘
```