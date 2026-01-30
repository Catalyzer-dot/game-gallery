extends Area2D

@export var speed := 400.0
@export var damage := 25.0
@export var homing_strength := 5.0  # 追踪强度
@export var bullet_color := Color(1, 1, 0, 1)

var target: CharacterBody2D = null
var velocity := Vector2.ZERO

@onready var trail_particles = $TrailParticles
@onready var sprite = $Sprite2D

func _ready():
	body_entered.connect(_on_body_entered)

	# 应用子弹颜色
	sprite.color = bullet_color

	if target and is_instance_valid(target):
		# 初始方向
		var direction = (target.global_position - global_position).normalized()
		velocity = direction * speed
		rotation = direction.angle()

func _physics_process(delta):
	if not target or not is_instance_valid(target):
		# 目标丢失，继续直线飞行
		position += velocity * delta
	else:
		# 追踪目标
		var direction = (target.global_position - global_position).normalized()
		velocity = velocity.lerp(direction * speed, homing_strength * delta)
		rotation = velocity.angle()
		position += velocity * delta

	# 检查是否飞出屏幕
	if not get_viewport_rect().has_point(global_position):
		queue_free()

func _on_body_entered(body):
	if body.is_in_group("enemies"):
		# 命中敌人
		body.take_damage(damage)

		# 创建爆炸粒子效果
		var explosion = $ExplosionParticles
		explosion.emitting = true
		explosion.reparent(get_parent())
		explosion.global_position = global_position

		# 延迟删除粒子
		get_tree().create_timer(explosion.lifetime).timeout.connect(
			func(): explosion.queue_free()
		)

		queue_free()
