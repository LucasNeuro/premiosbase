# 📁 ESTRUTURA DO PROJETO RUBY - PREMIOSBASE

## 🏗️ ESTRUTURA DE DIRETÓRIOS

```
premiosbase-backend/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── campaigns_controller.rb
│   │   │       ├── policies_controller.rb
│   │   │       ├── users_controller.rb
│   │   │       ├── notifications_controller.rb
│   │   │       └── dashboard_controller.rb
│   │   └── application_controller.rb
│   ├── models/
│   │   ├── campaign.rb
│   │   ├── policy.rb
│   │   ├── user.rb
│   │   ├── policy_campaign_link.rb
│   │   ├── notification.rb
│   │   ├── prize.rb
│   │   └── concerns/
│   │       ├── trackable.rb
│   │       └── cacheable.rb
│   ├── services/
│   │   ├── campaign_service.rb
│   │   ├── policy_service.rb
│   │   ├── campaign_progress_calculator.rb
│   │   ├── policy_linking_service.rb
│   │   ├── notification_service.rb
│   │   └── cnpj_validation_service.rb
│   ├── jobs/
│   │   ├── campaign_progress_update_job.rb
│   │   ├── policy_linking_job.rb
│   │   ├── notification_job.rb
│   │   └── data_cleanup_job.rb
│   ├── serializers/
│   │   ├── campaign_serializer.rb
│   │   ├── policy_serializer.rb
│   │   └── user_serializer.rb
│   ├── policies/
│   │   ├── campaign_policy.rb
│   │   ├── policy_policy.rb
│   │   └── user_policy.rb
│   └── channels/
│       ├── campaign_channel.rb
│       └── notification_channel.rb
├── config/
│   ├── routes.rb
│   ├── database.yml
│   ├── application.rb
│   └── environments/
│       ├── development.rb
│       ├── production.rb
│       └── test.rb
├── db/
│   ├── migrate/
│   ├── schema.rb
│   └── seeds.rb
├── lib/
│   ├── tasks/
│   │   ├── data_migration.rake
│   │   └── cleanup.rake
│   └── services/
│       ├── external/
│       │   ├── cnpj_api_client.rb
│       │   └── email_service_client.rb
│       └── internal/
│           ├── cache_manager.rb
│           └── audit_logger.rb
├── spec/
│   ├── models/
│   ├── controllers/
│   ├── services/
│   └── jobs/
├── Gemfile
├── Gemfile.lock
├── Rakefile
├── config.ru
└── README.md
```

## 🔧 CONFIGURAÇÕES PRINCIPAIS

### Gemfile
```ruby
source 'https://rubygems.org'
ruby '3.2.0'

gem 'rails', '~> 7.0'
gem 'pg', '~> 1.1'
gem 'redis', '~> 5.0'
gem 'sidekiq', '~> 7.0'
gem 'pundit', '~> 2.0'
gem 'jbuilder', '~> 2.7'
gem 'rack-cors'
gem 'rack-attack'
gem 'redis-rails'
gem 'faraday'
gem 'dry-validation'
gem 'dry-monads'
gem 'dry-struct'

group :development, :test do
  gem 'rspec-rails'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'shoulda-matchers'
  gem 'database_cleaner'
end

group :development do
  gem 'annotate'
  gem 'rubocop'
  gem 'brakeman'
end
```

### config/application.rb
```ruby
module PremiosBaseBackend
  class Application < Rails::Application
    config.load_defaults 7.0
    
    # API only
    config.api_only = true
    
    # CORS
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins ENV['ALLOWED_ORIGINS']&.split(',') || ['http://localhost:3000']
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          credentials: true
      end
    end
    
    # Background jobs
    config.active_job.queue_adapter = :sidekiq
    
    # Cache
    config.cache_store = :redis_cache_store, { url: ENV['REDIS_URL'] }
  end
end
```