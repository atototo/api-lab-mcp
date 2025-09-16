# NPM 패키지 퍼블리시 가이드

이 문서는 API Forge를 NPM 패키지로 퍼블리시하고 Claude Code에서 사용하는 방법을 설명합니다.

## 📦 NPM 패키지란?

NPM (Node Package Manager)은 JavaScript 패키지를 공유하는 세계 최대의 소프트웨어 레지스트리입니다.
- **레지스트리**: https://www.npmjs.com
- **무료**: 공개 패키지는 무료로 퍼블리시 가능
- **설치**: 전 세계 누구나 `npm install`로 설치 가능

## 🧪 로컬 테스트 (퍼블리시 전)

### 방법 1: npm link 사용

현재 프로젝트를 로컬 npm 패키지로 등록:

```bash
# api-forge 프로젝트 디렉토리에서
cd /Users/winter.e/easy-work/api-forge

# 빌드
npm run build

# 전역 심볼릭 링크 생성
npm link

# 확인
npm list -g --depth=0
# api-forge@0.5.0 -> /Users/winter.e/easy-work/api-forge
```

다른 프로젝트에서 테스트:

```bash
# 테스트할 프로젝트에서
npm link api-forge

# 또는 직접 실행
npx api-forge
```

### 방법 2: Claude Code에서 로컬 테스트

```bash
# Claude Code의 /mcp 명령으로 추가
claude mcp add api-forge-local node /Users/winter.e/easy-work/api-forge/dist/mcp/server.js
```

### 방법 3: package.json에서 직접 참조

```json
{
  "dependencies": {
    "api-forge": "file:../api-forge"
  }
}
```

## 🚀 NPM 퍼블리시 과정

### 1단계: NPM 계정 준비

#### 옵션 A: 웹사이트에서 가입
1. https://www.npmjs.com/signup 방문
2. Username, Email, Password 설정
3. 이메일 인증

#### 옵션 B: CLI에서 가입
```bash
npm adduser
# Username: (원하는 이름)
# Password: (비밀번호)
# Email: (이메일)
```

### 2단계: 로그인

```bash
npm login
# Username, Password, Email 입력
# OTP 인증 (2FA 설정한 경우)

# 로그인 확인
npm whoami
```

### 3단계: 패키지 준비

#### package.json 필수 필드 확인:

```json
{
  "name": "api-forge",           // 또는 "@username/api-forge" (scoped)
  "version": "0.5.0",            // 시맨틱 버저닝
  "description": "...",          // 패키지 설명
  "main": "dist/mcp/server.js",  // 진입점
  "bin": {                       // CLI 실행 파일
    "api-forge": "./dist/mcp/server.js"
  },
  "keywords": ["mcp", "api", "testing"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/api-forge"
  }
}
```

#### .npmignore 파일 생성:

```
src/
tests/
examples/
*.ts
tsconfig.json
.env
.git/
node_modules/
```

### 4단계: 패키지 이름 확인

```bash
# 이미 사용중인 이름인지 확인
npm search api-forge

# 또는 웹에서 확인
# https://www.npmjs.com/package/api-forge
```

### 5단계: 퍼블리시

```bash
# 빌드 먼저
npm run build

# 드라이런 (실제로 퍼블리시하지 않고 테스트)
npm publish --dry-run

# 실제 퍼블리시
npm publish

# Scoped 패키지의 경우 (예: @username/api-forge)
npm publish --access public
```

### 6단계: 확인

```bash
# 퍼블리시된 패키지 확인
npm info api-forge

# 웹에서 확인
# https://www.npmjs.com/package/api-forge
```

## 🔧 Claude Code에서 사용

퍼블리시 후 Claude Code에서 추가:

```bash
# Claude Code 터미널에서
claude mcp add api-forge npx api-forge@latest

# 또는 특정 버전
claude mcp add api-forge npx api-forge@0.5.0
```

## 📝 버전 관리

### 버전 올리기

```bash
# 패치 버전 (0.5.0 -> 0.5.1)
npm version patch

# 마이너 버전 (0.5.0 -> 0.6.0)
npm version minor

# 메이저 버전 (0.5.0 -> 1.0.0)
npm version major

# 커밋 메시지와 함께
npm version patch -m "Fix bug in %s"
```

### 태그 관리

```bash
# latest 태그 (기본)
npm publish

# beta 태그
npm publish --tag beta

# 사용자가 설치
npm install api-forge@beta
```

## ⚠️ 주의사항

### 공개 패키지 특징
- **영구 공개**: 한번 퍼블리시하면 전 세계에 공개
- **삭제 제한**: 72시간 이내에만 삭제 가능
- **버전 불변**: 같은 버전으로 재퍼블리시 불가

### 삭제 방법 (72시간 이내)

```bash
npm unpublish api-forge@0.5.0
# 또는 전체 패키지 삭제
npm unpublish api-forge --force
```

## 🏷️ Scoped 패키지

개인/조직 네임스페이스 사용:

```json
{
  "name": "@winter/api-forge"
}
```

```bash
# 퍼블리시 (공개로 설정 필요)
npm publish --access public

# 설치
npm install @winter/api-forge
```

## 🔐 Private 패키지 (유료)

```bash
# private으로 퍼블리시
npm publish --access restricted

# 팀/조직 멤버만 설치 가능
npm install @company/api-forge
```

## 🛠️ 트러블슈팅

### 로그인 문제
```bash
# 로그인 상태 확인
npm whoami

# 로그아웃 후 재로그인
npm logout
npm login
```

### 권한 문제
```bash
# 패키지 소유자 확인
npm owner ls api-forge

# 소유자 추가
npm owner add username api-forge
```

### 퍼블리시 실패
- 이름 중복: 다른 이름 사용 또는 scoped 패키지 사용
- 버전 중복: `npm version` 명령으로 버전 올리기
- 인증 실패: `npm login` 다시 실행

## 📚 추가 리소스

- [NPM 공식 문서](https://docs.npmjs.com/)
- [시맨틱 버저닝](https://semver.org/)
- [NPM 베스트 프랙티스](https://docs.npmjs.com/packages-and-modules/introduction-to-packages-and-modules)
- [Claude Code MCP 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)