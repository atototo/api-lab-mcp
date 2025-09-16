# Phase 5 테스트 가이드

## 1단계: API 명세 분석하기

### 전체 API 분석
```json
{
  "tool": "analyze_api_spec",
  "args": {
    "source": "examples/petstore-openapi.json"
  }
}
```

이 명령으로 확인할 수 있는 것:
- API 제목, 버전, 설명
- 서버 URL 정보
- 전체 엔드포인트 목록
- 각 엔드포인트의 파라미터, 요청/응답 정보
- 보안 스키마 정보

### 특정 태그로 필터링
```json
{
  "tool": "analyze_api_spec", 
  "args": {
    "source": "examples/petstore-openapi.json",
    "filter": {
      "tag": "pet"
    }
  }
}
```

### GET 메소드만 보기
```json
{
  "tool": "analyze_api_spec",
  "args": {
    "source": "examples/petstore-openapi.json",
    "filter": {
      "method": "GET"
    }
  }
}
```

## 2단계: 테스트 시나리오 자동 생성

### 모든 종류의 테스트 생성
```json
{
  "tool": "generate_test_scenarios",
  "args": {
    "source": "examples/petstore-openapi.json"
  }
}
```

이것이 자동으로 생성하는 테스트들:
- ✅ Happy Path: 정상 동작 테스트
- ❌ Error Handling: 400, 401, 404 에러 테스트  
- 🔢 Boundary: 경계값 테스트
- 🔒 Security: SQL Injection, XSS 테스트
- ⚡ Performance: 응답 시간 테스트

### 높은 우선순위만 생성
```json
{
  "tool": "generate_test_scenarios",
  "args": {
    "source": "examples/petstore-openapi.json",
    "options": {
      "priority": "high",
      "maxScenariosPerEndpoint": 3
    }
  }
}
```

### 보안 테스트만 생성
```json
{
  "tool": "generate_test_scenarios",
  "args": {
    "source": "examples/petstore-openapi.json",
    "options": {
      "categories": ["security", "error_handling"],
      "includeSecurity": true
    }
  }
}
```

### 파일로 저장하기
```json
{
  "tool": "generate_test_scenarios",
  "args": {
    "source": "examples/petstore-openapi.json",
    "outputFile": "petstore-tests.json"
  }
}
```

## 3단계: 생성된 테스트 실행하기

### 실제 Petstore API 테스트
```json
{
  "tool": "test_with_assertions",
  "args": {
    "url": "https://petstore.swagger.io/v2/pet/1",
    "method": "GET",
    "assertions": [
      {
        "type": "status",
        "expected": 200
      },
      {
        "type": "response_time",
        "operator": "less_than", 
        "expected": 2000
      }
    ]
  }
}
```

### 배치로 여러 테스트 실행
```json
{
  "tool": "batch_test",
  "args": {
    "tests": [
      {
        "name": "Get existing pet",
        "url": "https://petstore.swagger.io/v2/pet/1",
        "method": "GET"
      },
      {
        "name": "Get non-existent pet", 
        "url": "https://petstore.swagger.io/v2/pet/99999",
        "method": "GET"
      },
      {
        "name": "Find pets by status",
        "url": "https://petstore.swagger.io/v2/pet/findByStatus?status=available",
        "method": "GET"
      }
    ],
    "options": {
      "parallel": true
    }
  }
}
```

## 실제 활용 시나리오

### 시나리오 1: 새 API 개발 후 테스트
1. OpenAPI 명세서 작성 (또는 자동 생성)
2. `analyze_api_spec`으로 명세 확인
3. `generate_test_scenarios`로 테스트 자동 생성
4. `batch_test`로 모든 테스트 실행
5. 결과 확인 및 API 수정

### 시나리오 2: CI/CD 파이프라인 통합
```bash
# GitHub Actions에서
- name: Generate API Tests
  run: |
    echo '{"tool":"generate_test_scenarios","args":{"source":"api/openapi.yaml"}}' | npx api-forge
    
- name: Run API Tests  
  run: |
    echo '{"tool":"batch_test","args":{"tests":"generated-tests.json"}}' | npx api-forge
```

### 시나리오 3: 외부 API 통합 테스트
```json
{
  "tool": "analyze_api_spec",
  "args": {
    "source": "https://raw.githubusercontent.com/APIs-guru/openapi-directory/main/APIs/github.com/v3/openapi.yaml"
  }
}
```

## 테스트 결과 확인 포인트

생성된 시나리오를 보면:
- 각 엔드포인트별로 5-10개의 테스트 케이스
- 카테고리별 분포 (happy_path, error, security 등)
- 우선순위 표시 (high, medium, low)
- 테스트 커버리지 퍼센트

## 장점

1. **테스트 코드 작성 불필요**: OpenAPI 명세만 있으면 자동 생성
2. **포괄적 테스트**: 정상, 에러, 보안, 성능 모두 커버
3. **AI 지능**: 엔드포인트 특성에 맞는 테스트 생성
4. **즉시 실행 가능**: MCP 도구로 바로 테스트

이제 Claude Desktop에서 위 명령들을 순서대로 실행해보세요!