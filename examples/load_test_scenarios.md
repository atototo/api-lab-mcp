# API Forge 부하 테스트 시나리오

## 🔥 부하 테스트 (Load Testing with BatchTestService)

### 1. 기본 부하 테스트 - 동시 사용자 시뮬레이션
```
batch_test로 동일한 엔드포인트에 10명의 동시 사용자를 시뮬레이션해줘:
tests: [
  { name: "User 1", url: "https://httpbin.org/delay/0.5", method: "GET" },
  { name: "User 2", url: "https://httpbin.org/delay/0.5", method: "GET" },
  { name: "User 3", url: "https://httpbin.org/delay/0.5", method: "GET" },
  { name: "User 4", url: "https://httpbin.org/delay/0.5", method: "GET" },
  { name: "User 5", url: "https://httpbin.org/delay/0.5", method: "GET" },
  { name: "User 6", url: "https://httpbin.org/delay/0.5", method: "GET" },
  { name: "User 7", url: "https://httpbin.org/delay/0.5", method: "GET" },
  { name: "User 8", url: "https://httpbin.org/delay/0.5", method: "GET" },
  { name: "User 9", url: "https://httpbin.org/delay/0.5", method: "GET" },
  { name: "User 10", url: "https://httpbin.org/delay/0.5", method: "GET" }
]
options:
  parallel: true
  maxConcurrent: 10
  reportFormat: "summary"
```

### 2. 단계적 부하 증가 (Ramp-up Test)
```
batch_test로 단계적으로 부하를 증가시켜줘:
tests: [
  // Wave 1: 2 concurrent users
  { name: "Wave1-User1", url: "https://httpbin.org/get", delay: 0 },
  { name: "Wave1-User2", url: "https://httpbin.org/get", delay: 0 },
  // Wave 2: 3 more users after 1 second
  { name: "Wave2-User1", url: "https://httpbin.org/get", delay: 1000 },
  { name: "Wave2-User2", url: "https://httpbin.org/get", delay: 1000 },
  { name: "Wave2-User3", url: "https://httpbin.org/get", delay: 1000 },
  // Wave 3: 5 more users after 2 seconds
  { name: "Wave3-User1", url: "https://httpbin.org/get", delay: 2000 },
  { name: "Wave3-User2", url: "https://httpbin.org/get", delay: 2000 },
  { name: "Wave3-User3", url: "https://httpbin.org/get", delay: 2000 },
  { name: "Wave3-User4", url: "https://httpbin.org/get", delay: 2000 },
  { name: "Wave3-User5", url: "https://httpbin.org/get", delay: 2000 }
]
options:
  parallel: true
  maxConcurrent: 10
```

### 3. 스파이크 테스트 (Spike Test)
```
batch_test로 갑작스러운 트래픽 증가를 테스트해줘:
tests: [
  // 50개의 동시 요청을 한 번에 전송
  ...Array(50).fill(null).map((_, i) => ({
    name: `Spike-Request-${i+1}`,
    url: "https://httpbin.org/anything",
    method: "POST",
    body: { userId: i+1, action: "login" }
  }))
]
options:
  parallel: true
  maxConcurrent: 50  // 모든 요청을 동시에
  timeout: 10000
  reportFormat: "summary"
```

### 4. 지속 부하 테스트 (Sustained Load Test)
```
batch_test로 지속적인 부하를 테스트해줘:
tests: [
  // 20개의 요청을 5개씩 동시에 처리
  ...Array(20).fill(null).map((_, i) => ({
    name: `Sustained-${i+1}`,
    url: "https://jsonplaceholder.typicode.com/posts",
    method: "GET",
    assertions: [
      { type: "status", expected: 200 },
      { type: "responseTime", expected: 2000, operator: "lessThan" }
    ]
  }))
]
options:
  parallel: true
  maxConcurrent: 5  // 동시 실행 제한
  delayBetween: 100  // 요청 간 100ms 지연
```

### 5. API 엔드포인트별 부하 분산 테스트
```
batch_test로 여러 엔드포인트에 부하를 분산해서 테스트해줘:
tests: [
  // 읽기 작업 (70%)
  ...Array(7).fill(null).map((_, i) => ({
    name: `Read-${i+1}`,
    url: `https://jsonplaceholder.typicode.com/posts/${i+1}`,
    method: "GET"
  })),
  // 쓰기 작업 (20%)
  ...Array(2).fill(null).map((_, i) => ({
    name: `Write-${i+1}`,
    url: "https://jsonplaceholder.typicode.com/posts",
    method: "POST",
    body: { title: `Test ${i+1}`, body: "Content", userId: 1 }
  })),
  // 삭제 작업 (10%)
  {
    name: "Delete-1",
    url: "https://jsonplaceholder.typicode.com/posts/1",
    method: "DELETE"
  }
]
options:
  parallel: true
  maxConcurrent: 3
```

### 6. 성능 임계값 테스트
```
batch_test로 성능 임계값을 검증해줘:
tests: [
  ...Array(10).fill(null).map((_, i) => ({
    name: `Performance-${i+1}`,
    url: "https://httpbin.org/delay/0.5",
    method: "GET",
    assertions: [
      { type: "responseTime", expected: 1000, operator: "lessThan" },
      { type: "status", expected: 200 }
    ]
  }))
]
options:
  parallel: true
  maxConcurrent: 5
  stopOnFailure: true  // 성능 기준 미달 시 중단
  reportFormat: "full"
```

### 7. Rate Limiting 검증
```
batch_test로 API의 Rate Limiting을 테스트해줘:
tests: [
  // 100개의 요청을 빠르게 전송
  ...Array(100).fill(null).map((_, i) => ({
    name: `RateLimit-${i+1}`,
    url: "https://api.github.com/rate_limit",
    method: "GET"
  }))
]
options:
  parallel: true
  maxConcurrent: 10
  delayBetween: 50  // 50ms 간격으로 제한
  retryOnFailure: false  // 429 에러 시 재시도 안 함
  reportFormat: "summary"
```

### 8. 인증이 필요한 부하 테스트
```
batch_test로 인증이 필요한 API에 부하 테스트를 실행해줘:
tests: [
  ...Array(20).fill(null).map((_, i) => ({
    name: `AuthLoad-${i+1}`,
    url: "https://httpbin.org/bearer",
    method: "GET",
    auth: { type: "bearer", token: "test-token-123" },
    assertions: [
      { type: "status", expected: 200 }
    ]
  }))
]
options:
  parallel: true
  maxConcurrent: 5
```

### 9. 혼합 워크로드 테스트 (Mixed Workload)
```
batch_test로 실제 사용 패턴을 시뮬레이션해줘:
tests: [
  // 로그인 (10%)
  ...Array(2).fill(null).map((_, i) => ({
    name: `Login-${i+1}`,
    url: "https://httpbin.org/post",
    method: "POST",
    body: { username: `user${i}`, password: "pass" },
    delay: i * 100
  })),
  // 데이터 조회 (60%)
  ...Array(12).fill(null).map((_, i) => ({
    name: `Read-${i+1}`,
    url: `https://jsonplaceholder.typicode.com/posts/${i+1}`,
    method: "GET",
    delay: i * 50
  })),
  // 데이터 생성 (20%)
  ...Array(4).fill(null).map((_, i) => ({
    name: `Create-${i+1}`,
    url: "https://jsonplaceholder.typicode.com/posts",
    method: "POST",
    body: { title: `Post ${i}`, body: "Content", userId: 1 },
    delay: i * 200
  })),
  // 데이터 수정 (10%)
  ...Array(2).fill(null).map((_, i) => ({
    name: `Update-${i+1}`,
    url: `https://jsonplaceholder.typicode.com/posts/${i+1}`,
    method: "PUT",
    body: { id: i+1, title: "Updated", body: "Updated content", userId: 1 },
    delay: i * 300
  }))
]
options:
  parallel: true
  maxConcurrent: 8
  timeout: 5000
```

### 10. 장시간 연결 테스트 (Long Connection Test)
```
batch_test로 장시간 연결을 유지하는 테스트를 실행해줘:
tests: [
  ...Array(5).fill(null).map((_, i) => ({
    name: `LongConnection-${i+1}`,
    url: `https://httpbin.org/delay/${i+1}`,  // 1~5초 지연
    method: "GET",
    assertions: [
      { type: "status", expected: 200 },
      { type: "responseTime", expected: (i+2)*1000, operator: "lessThan" }
    ]
  }))
]
options:
  parallel: true
  maxConcurrent: 5
  timeout: 30000  // 30초 타임아웃
```

## 📊 부하 테스트 결과 분석

### 성능 메트릭 확인
```
batch_test 실행 후 다음 메트릭을 확인:
- successRate: 성공률 (목표: >99%)
- averageDuration: 평균 응답 시간 (목표: <500ms)
- minDuration: 최소 응답 시간
- maxDuration: 최대 응답 시간 (목표: <2000ms)
- totalDuration: 전체 테스트 시간
```

### 병목 지점 찾기
```
reportFormat을 "full"로 설정하여 각 요청의 상세 정보 확인:
- 어느 요청이 가장 느린가?
- 특정 시점에 실패가 집중되는가?
- 응답 시간이 점진적으로 증가하는가?
```

## 🎯 부하 테스트 Best Practices

1. **점진적 부하 증가**: 갑자기 많은 부하를 주지 말고 단계적으로 증가
2. **실제 사용 패턴 모방**: 읽기/쓰기 비율을 실제와 유사하게 설정
3. **타임아웃 설정**: 적절한 타임아웃으로 무한 대기 방지
4. **에러 처리**: retryOnFailure로 일시적 오류 대응
5. **메트릭 모니터링**: 성공률, 응답 시간 지속적 확인