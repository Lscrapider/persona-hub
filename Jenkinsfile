pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Quality checks') {
            steps {
                sh 'pnpm typecheck'
                sh 'pnpm lint'
                sh 'pnpm build'
            }
        }

        stage('Validate deployment') {
            steps {
                sh 'docker compose config --quiet'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d --build --remove-orphans'
                sh 'docker compose ps --status running --services | grep -Fx scra-atlas'
            }
        }
    }

    post {
        failure {
            sh 'docker compose ps || true'
            sh 'docker compose logs --tail=100 || true'
        }
    }
}
