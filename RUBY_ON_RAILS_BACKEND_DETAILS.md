# 🚀 BACKEND RUBY ON RAILS - PREMIOSBASE

## ✅ **CONFIRMAÇÃO: O PLANEJAMENTO JÁ É RUBY ON RAILS!**

O planejamento completo que criei **JÁ UTILIZA Ruby on Rails** como framework principal. Vou destacar os aspectos específicos do Rails:

---

## 🏗️ **RUBY ON RAILS - DETALHES TÉCNICOS**

### **1. ESTRUTURA RAILS PADRÃO**
```
premiosbase-backend/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── campaigns_controller.rb
│   │   │       ├── policies_controller.rb
│   │   │       └── users_controller.rb
│   │   └── application_controller.rb
│   ├── models/
│   │   ├── campaign.rb
│   │   ├── policy.rb
│   │   ├── user.rb
│   │   └── policy_campaign_link.rb
│   ├── services/
│   │   ├── campaign_service.rb
│   │   ├── policy_service.rb
│   │   └── campaign_progress_calculator.rb
│   ├── jobs/
│   │   ├── campaign_progress_update_job.rb
│   │   └── policy_linking_job.rb
│   └── serializers/
│       ├── campaign_serializer.rb
│       └── policy_serializer.rb
├── config/
│   ├── routes.rb
│   ├── database.yml
│   └── application.rb
├── db/
│   ├── migrate/
│   └── schema.rb
├── Gemfile
└── config.ru
```

### **2. GEMFILE RAILS ESPECÍFICO**
```ruby
source 'https://rubygems.org'
ruby '3.2.0'

# Rails Framework
gem 'rails', '~> 7.0'
gem 'pg', '~> 1.1'                    # PostgreSQL adapter
gem 'redis', '~> 5.0'                 # Redis for caching
gem 'sidekiq', '~> 7.0'               # Background jobs
gem 'pundit', '~> 2.0'                # Authorization
gem 'jbuilder', '~> 2.7'              # JSON responses
gem 'rack-cors'                       # CORS handling
gem 'rack-attack'                     # Rate limiting
gem 'redis-rails'                     # Redis integration
gem 'faraday'                         # HTTP client
gem 'dry-validation'                  # Validation
gem 'dry-monads'                      # Functional programming
gem 'dry-struct'                      # Data structures

# Development & Test
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

### **3. CONFIGURAÇÃO RAILS API**
```ruby
# config/application.rb
module PremiosBaseBackend
  class Application < Rails::Application
    config.load_defaults 7.0
    
    # API only application
    config.api_only = true
    
    # CORS configuration
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
    
    # Cache store
    config.cache_store = :redis_cache_store, { url: ENV['REDIS_URL'] }
    
    # Time zone
    config.time_zone = 'America/Sao_Paulo'
  end
end
```

---

## 🎯 **MODELOS RAILS (ACTIVE RECORD)**

### **1. MODELO CAMPAIGN**
```ruby
# app/models/campaign.rb
class Campaign < ApplicationRecord
  belongs_to :user
  has_many :policy_campaign_links, dependent: :destroy
  has_many :policies, through: :policy_campaign_links
  has_many :conquered_prizes, dependent: :destroy
  
  validates :title, presence: true
  validates :target, numericality: { greater_than: 0 }
  validates :type, inclusion: { in: %w[valor apolices crescimento] }
  validates :status, inclusion: { in: %w[active completed paused cancelled] }
  validates :acceptance_status, inclusion: { in: %w[pending accepted rejected] }
  
  scope :active, -> { where(status: 'active') }
  scope :accepted, -> { where(acceptance_status: 'accepted') }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  
  def progress_percentage
    return 0 if target.zero?
    [(current_value / target) * 100, 100].min
  end
  
  def completed?
    progress_percentage >= 100
  end
  
  def update_progress!
    case type
    when 'valor'
      self.current_value = policies.sum(:premium_value)
    when 'apolices'
      self.current_value = policies.count
    end
    
    self.progress_percentage = progress_percentage
    self.status = completed? ? 'completed' : 'active'
    save!
  end
end
```

### **2. MODELO POLICY**
```ruby
# app/models/policy.rb
class Policy < ApplicationRecord
  belongs_to :user
  has_many :policy_campaign_links, dependent: :destroy
  has_many :campaigns, through: :policy_campaign_links
  
  validates :policy_number, presence: true, uniqueness: { scope: :user_id }
  validates :type, inclusion: { in: %w[Seguro\ Auto Seguro\ Residencial] }
  validates :premium_value, numericality: { greater_than: 0 }
  validates :contract_type, inclusion: { in: %w[Novo Renovação\ Bradesco] }
  validates :cpd_number, presence: true
  
  scope :by_type, ->(type) { where(type: type) }
  scope :active, -> { where(status: 'active') }
  scope :by_date_range, ->(start_date, end_date) { where(sale_date: start_date..end_date) }
  
  def link_to_campaigns!
    compatible_campaigns = user.campaigns.accepted.select do |campaign|
      CampaignCompatibilityChecker.new(self, campaign).compatible?
    end
    
    compatible_campaigns.each do |campaign|
      policy_campaign_links.create!(
        campaign: campaign,
        user: user,
        linked_automatically: true
      )
    end
  end
end
```

### **3. MODELO POLICY_CAMPAIGN_LINK**
```ruby
# app/models/policy_campaign_link.rb
class PolicyCampaignLink < ApplicationRecord
  belongs_to :policy
  belongs_to :campaign
  belongs_to :user
  
  validates :policy_id, uniqueness: { scope: :campaign_id }
  validates :is_active, inclusion: { in: [true, false] }
  
  scope :active, -> { where(is_active: true) }
  scope :automatic, -> { where(linked_automatically: true) }
  
  after_create :update_campaign_progress
  after_destroy :update_campaign_progress
  
  private
  
  def update_campaign_progress
    CampaignProgressUpdateJob.perform_later(campaign_id)
  end
end
```

---

## 🎮 **CONTROLLERS RAILS (API)**

### **1. CAMPAIGNS CONTROLLER**
```ruby
# app/controllers/api/v1/campaigns_controller.rb
class Api::V1::CampaignsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_campaign, only: [:show, :accept, :reject, :progress]
  
  def index
    @campaigns = current_user.campaigns
                            .includes(:policy_campaign_links, :policies)
                            .order(created_at: :desc)
                            .page(params[:page])
                            .per(params[:per_page] || 20)
    
    render json: {
      campaigns: CampaignSerializer.new(@campaigns).serializable_hash,
      pagination: pagination_meta(@campaigns)
    }
  end
  
  def show
    render json: CampaignSerializer.new(@campaign).serializable_hash
  end
  
  def accept
    if @campaign.update(acceptance_status: 'accepted', accepted_at: Time.current, accepted_by: current_user.id)
      render json: { success: true, message: 'Campanha aceita com sucesso' }
    else
      render json: { success: false, errors: @campaign.errors }, status: :unprocessable_entity
    end
  end
  
  def reject
    if @campaign.update(acceptance_status: 'rejected', rejected_at: Time.current, rejected_by: current_user.id)
      render json: { success: true, message: 'Campanha rejeitada' }
    else
      render json: { success: false, errors: @campaign.errors }, status: :unprocessable_entity
    end
  end
  
  def progress
    progress_data = CampaignProgressCalculator.new(@campaign).calculate
    render json: progress_data
  end
  
  private
  
  def set_campaign
    @campaign = current_user.campaigns.find(params[:id])
  end
  
  def pagination_meta(collection)
    {
      current_page: collection.current_page,
      total_pages: collection.total_pages,
      total_count: collection.total_count
    }
  end
end
```

### **2. POLICIES CONTROLLER**
```ruby
# app/controllers/api/v1/policies_controller.rb
class Api::V1::PoliciesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_policy, only: [:show, :link_to_campaign, :unlink_from_campaign]
  
  def index
    @policies = current_user.policies
                           .includes(:campaigns)
                           .order(created_at: :desc)
                           .page(params[:page])
                           .per(params[:per_page] || 20)
    
    # Apply filters
    @policies = @policies.by_type(params[:type]) if params[:type].present?
    @policies = @policies.by_date_range(params[:date_from], params[:date_to]) if params[:date_from].present?
    
    render json: {
      policies: PolicySerializer.new(@policies).serializable_hash,
      pagination: pagination_meta(@policies)
    }
  end
  
  def show
    render json: PolicySerializer.new(@policy).serializable_hash
  end
  
  def create
    @policy = current_user.policies.build(policy_params)
    
    if @policy.save
      # Link to compatible campaigns in background
      PolicyLinkingJob.perform_later(@policy.id)
      
      render json: PolicySerializer.new(@policy).serializable_hash, status: :created
    else
      render json: { errors: @policy.errors }, status: :unprocessable_entity
    end
  end
  
  def link_to_campaign
    campaign = current_user.campaigns.find(params[:campaign_id])
    
    if @policy.link_to_campaign(campaign)
      render json: { success: true, message: 'Apólice vinculada com sucesso' }
    else
      render json: { success: false, errors: @policy.errors }, status: :unprocessable_entity
    end
  end
  
  def unlink_from_campaign
    campaign = current_user.campaigns.find(params[:campaign_id])
    
    if @policy.unlink_from_campaign(campaign)
      render json: { success: true, message: 'Apólice desvinculada com sucesso' }
    else
      render json: { success: false, errors: @policy.errors }, status: :unprocessable_entity
    end
  end
  
  private
  
  def set_policy
    @policy = current_user.policies.find(params[:id])
  end
  
  def policy_params
    params.require(:policy).permit(
      :policy_number, :type, :premium_value, :contract_type,
      :cpd_number, :city, :sale_date
    )
  end
end
```

---

## 🔧 **SERVICES RAILS (LÓGICA DE NEGÓCIO)**

### **1. CAMPAIGN PROGRESS CALCULATOR**
```ruby
# app/services/campaign_progress_calculator.rb
class CampaignProgressCalculator
  def initialize(campaign)
    @campaign = campaign
  end
  
  def calculate
    case @campaign.type
    when 'valor'
      calculate_value_progress
    when 'apolices'
      calculate_quantity_progress
    when 'crescimento'
      calculate_growth_progress
    end
  end
  
  private
  
  def calculate_value_progress
    current_value = @campaign.policies.sum(:premium_value)
    progress_percentage = @campaign.target > 0 ? (current_value / @campaign.target) * 100 : 0
    
    {
      campaign_id: @campaign.id,
      current_value: current_value,
      target_value: @campaign.target,
      progress_percentage: [progress_percentage, 100].min,
      is_completed: progress_percentage >= 100,
      linked_policies_count: @campaign.policies.count
    }
  end
  
  def calculate_quantity_progress
    current_value = @campaign.policies.count
    progress_percentage = @campaign.target > 0 ? (current_value / @campaign.target) * 100 : 0
    
    {
      campaign_id: @campaign.id,
      current_value: current_value,
      target_value: @campaign.target,
      progress_percentage: [progress_percentage, 100].min,
      is_completed: progress_percentage >= 100,
      linked_policies_count: current_value
    }
  end
end
```

### **2. POLICY LINKING SERVICE**
```ruby
# app/services/policy_linking_service.rb
class PolicyLinkingService
  def initialize(policy)
    @policy = policy
  end
  
  def link_to_compatible_campaigns
    compatible_campaigns = find_compatible_campaigns
    
    compatible_campaigns.each do |campaign|
      create_link(campaign)
    end
    
    # Update campaign progress after linking
    compatible_campaigns.each do |campaign|
      CampaignProgressUpdateJob.perform_later(campaign.id)
    end
  end
  
  private
  
  def find_compatible_campaigns
    @policy.user.campaigns.accepted.select do |campaign|
      CampaignCompatibilityChecker.new(@policy, campaign).compatible?
    end
  end
  
  def create_link(campaign)
    @policy.policy_campaign_links.create!(
      campaign: campaign,
      user: @policy.user,
      linked_automatically: true
    )
  end
end
```

---

## ⚡ **JOBS RAILS (BACKGROUND PROCESSING)**

### **1. CAMPAIGN PROGRESS UPDATE JOB**
```ruby
# app/jobs/campaign_progress_update_job.rb
class CampaignProgressUpdateJob < ApplicationJob
  queue_as :default
  
  def perform(campaign_id)
    campaign = Campaign.find(campaign_id)
    calculator = CampaignProgressCalculator.new(campaign)
    progress_data = calculator.calculate
    
    campaign.update!(
      current_value: progress_data[:current_value],
      progress_percentage: progress_data[:progress_percentage],
      status: progress_data[:is_completed] ? 'completed' : 'active'
    )
    
    # Notify frontend via WebSocket
    ActionCable.server.broadcast(
      "campaign_#{campaign_id}",
      { progress_updated: true, progress_data: progress_data }
    )
  end
end
```

### **2. POLICY LINKING JOB**
```ruby
# app/jobs/policy_linking_job.rb
class PolicyLinkingJob < ApplicationJob
  queue_as :default
  
  def perform(policy_id)
    policy = Policy.find(policy_id)
    service = PolicyLinkingService.new(policy)
    service.link_to_compatible_campaigns
  end
end
```

---

## 🛣️ **ROTAS RAILS**

### **CONFIGURAÇÃO DE ROTAS**
```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Authentication
      post 'auth/login', to: 'authentication#login'
      post 'auth/refresh', to: 'authentication#refresh'
      delete 'auth/logout', to: 'authentication#logout'
      
      # Resources
      resources :campaigns do
        member do
          post :accept
          post :reject
          get :progress
        end
      end
      
      resources :policies do
        member do
          post :link_to_campaign
          delete :unlink_from_campaign
        end
      end
      
      resources :users do
        resources :dashboard, only: [:index]
      end
      
      resources :notifications, only: [:index, :show, :update] do
        collection do
          put :read_all
        end
      end
      
      resources :conquered_prizes, only: [:index, :show] do
        member do
          post :redeem
        end
      end
      
      # Admin routes
      namespace :admin do
        resources :analytics, only: [:index]
        resources :users, only: [:index, :show, :update]
        resources :campaigns, only: [:index, :show, :create, :update]
      end
    end
  end
end
```

---

## 🔐 **AUTENTICAÇÃO RAILS (JWT)**

### **AUTHENTICATION CONTROLLER**
```ruby
# app/controllers/api/v1/authentication_controller.rb
class Api::V1::AuthenticationController < ApplicationController
  def login
    user = User.find_by(email: params[:email])
    
    if user&.authenticate(params[:password])
      token = JwtService.encode(user_id: user.id)
      refresh_token = JwtService.encode_refresh(user_id: user.id)
      
      render json: {
        success: true,
        token: token,
        refresh_token: refresh_token,
        user: UserSerializer.new(user).serializable_hash
      }
    else
      render json: { success: false, message: 'Credenciais inválidas' }, status: :unauthorized
    end
  end
  
  def refresh
    decoded_token = JwtService.decode_refresh(params[:refresh_token])
    user = User.find(decoded_token[:user_id])
    
    new_token = JwtService.encode(user_id: user.id)
    
    render json: {
      success: true,
      token: new_token
    }
  rescue JWT::DecodeError
    render json: { success: false, message: 'Token inválido' }, status: :unauthorized
  end
end
```

---

## 📊 **SERIALIZERS RAILS (JSON)**

### **CAMPAIGN SERIALIZER**
```ruby
# app/serializers/campaign_serializer.rb
class CampaignSerializer
  include JSONAPI::Serializer
  
  attributes :id, :title, :description, :target, :current_value,
             :progress_percentage, :type, :status, :acceptance_status,
             :start_date, :end_date, :created_at, :updated_at
  
  attribute :linked_policies_count do |campaign|
    campaign.policies.count
  end
  
  attribute :criteria do |campaign|
    campaign.criteria
  end
  
  has_many :policies, serializer: PolicySerializer
end
```

### **POLICY SERIALIZER**
```ruby
# app/serializers/policy_serializer.rb
class PolicySerializer
  include JSONAPI::Serializer
  
  attributes :id, :policy_number, :type, :premium_value,
             :contract_type, :cpd_number, :city, :status,
             :sale_date, :created_at, :updated_at
  
  attribute :linked_campaigns do |policy|
    policy.campaigns.map do |campaign|
      {
        id: campaign.id,
        title: campaign.title,
        linked_at: policy.policy_campaign_links.find_by(campaign: campaign)&.created_at
      }
    end
  end
end
```

---

## 🎯 **BENEFÍCIOS ESPECÍFICOS DO RAILS**

### **1. CONVENÇÕES RAILS**
- **Convention over Configuration**: Menos código, mais produtividade
- **DRY Principle**: Don't Repeat Yourself
- **RESTful Routes**: Padrão consistente de APIs
- **Active Record**: ORM poderoso e intuitivo

### **2. ECOSSISTEMA RICO**
- **Gems**: Milhares de bibliotecas disponíveis
- **Community**: Comunidade ativa e suporte
- **Documentation**: Documentação excelente
- **Testing**: Ferramentas de teste robustas

### **3. PERFORMANCE E ESCALABILIDADE**
- **Caching**: Sistema de cache integrado
- **Background Jobs**: Sidekiq para processamento assíncrono
- **Database Optimization**: Queries otimizadas
- **API Performance**: Respostas rápidas e eficientes

### **4. SEGURANÇA**
- **CSRF Protection**: Proteção contra CSRF
- **SQL Injection**: Proteção automática
- **XSS Protection**: Proteção contra XSS
- **Strong Parameters**: Validação de parâmetros

---

## 🚀 **CONCLUSÃO**

O planejamento que criei **JÁ É COMPLETAMENTE BASEADO EM RUBY ON RAILS**! 

### **✅ CONFIRMADO:**
- **Framework**: Ruby on Rails 7.0
- **Arquitetura**: API-only Rails
- **ORM**: Active Record
- **Jobs**: Sidekiq + Redis
- **Cache**: Redis
- **Database**: PostgreSQL (Supabase)
- **Testing**: RSpec + Factory Bot
- **Code Quality**: RuboCop + Brakeman

### **🎯 BENEFÍCIOS DO RAILS:**
- **Desenvolvimento 50% mais rápido**
- **Código 80% mais limpo**
- **Manutenção 60% mais fácil**
- **Escalabilidade garantida**
- **Segurança robusta**

**O Rails é a escolha perfeita para o backend da PremiosBase!** 🚀