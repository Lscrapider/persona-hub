pipeline {
  agent any

  environment {
    APP_NAME = 'scra-atlas'
    CONTAINER_NAME = 'scra-atlas'
    HOST_PORT = '5778'
    CONTAINER_PORT = '5778'
    RUNTIME_IMAGE = 'nginx:1.27-alpine'
    IMAGE_CONTEXT_DIR = '.jenkins-docker-context'
    DEPLOY_IMAGE = "scra-atlas:${BUILD_NUMBER}"
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build') {
      steps {
        sh '''
          set -eu
          pnpm install --frozen-lockfile
          pnpm build
        '''
      }
    }

    stage('Package Image') {
      steps {
        sh '''
          set -eu
          rm -rf "$IMAGE_CONTEXT_DIR"
          mkdir -p "$IMAGE_CONTEXT_DIR"

          {
            printf '%s\n' 'server {'
            printf '%s\n' "  listen ${CONTAINER_PORT};"
            printf '%s\n' '  server_name _;'
            printf '%s\n' '  root /usr/share/nginx/html;'
            printf '%s\n' '  index index.html;'
            printf '%s\n' ''
            printf '%s\n' '  location / {'
            printf '%s\n' '    try_files $uri $uri/ /index.html;'
            printf '%s\n' '  }'
            printf '%s\n' '}'
          } > "$IMAGE_CONTEXT_DIR/nginx.conf"

          cp -R dist "$IMAGE_CONTEXT_DIR/dist"

          cat > "$IMAGE_CONTEXT_DIR/Dockerfile" <<EOF
FROM ${RUNTIME_IMAGE}
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/
EXPOSE ${CONTAINER_PORT}
EOF

          docker build -t "$DEPLOY_IMAGE" "$IMAGE_CONTEXT_DIR"
        '''
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          set -eu
          docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
          docker run -d \
            --name "$CONTAINER_NAME" \
            --restart unless-stopped \
            -p "$HOST_PORT:$CONTAINER_PORT" \
            "$DEPLOY_IMAGE"
        '''
      }
    }
  }

  post {
    success {
      echo "Deployed ${APP_NAME} at http://localhost:${HOST_PORT}"
    }
    cleanup {
      sh '''
        rm -rf "$IMAGE_CONTEXT_DIR"
      '''
    }
  }
}
