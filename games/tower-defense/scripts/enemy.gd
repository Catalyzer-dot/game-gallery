extends CharacterBody2D

signal died(reward)
signal reached_end

@export var speed := 100.0
@export var health := 100.0
@export var max_health := 100.0
@export var reward := 10

var path_follow: PathFollow2D = null
var progress_ratio := 0.0

func _ready():
	add_to_group("enemies")
	$HealthBar.max_value = max_health
	$HealthBar.value = health

func _physics_process(delta):
	if path_follow == null:
		return

	progress_ratio += speed * delta / path_follow.get_parent().curve.get_baked_length()

	if progress_ratio >= 1.0:
		emit_signal("reached_end")
		queue_free()
		return

	path_follow.progress_ratio = progress_ratio
	position = path_follow.global_position

func take_damage(amount):
	health -= amount
	$HealthBar.value = health

	# 受伤粒子效果
	var particles = $HitParticles
	particles.emitting = true

	if health <= 0:
		die()

func die():
	emit_signal("died", reward)

	# 死亡粒子效果
	var death_particles = $DeathParticles
	death_particles.emitting = true
	death_particles.reparent(get_parent())
	death_particles.global_position = global_position

	# 延迟删除粒子
	get_tree().create_timer(death_particles.lifetime).timeout.connect(
		func(): death_particles.queue_free()
	)

	queue_free()
