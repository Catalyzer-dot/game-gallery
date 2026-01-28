extends CanvasLayer

@onready var money_label = $TopLeftPanel/VBox/MoneyLabel
@onready var lives_label = $TopLeftPanel/VBox/LivesLabel
@onready var wave_label = $WavePanel/WaveLabel
@onready var game_over_panel = $GameOverPanel

func _ready():
	game_over_panel.visible = false

func update_money(amount: int):
	money_label.text = "金币: $" + str(amount)

func update_lives(amount: int):
	lives_label.text = "生命: " + str(amount)

func update_wave(wave: int):
	wave_label.text = "波次 " + str(wave) + "/10"

func show_game_over():
	game_over_panel.visible = true

func _on_restart_button_pressed():
	get_tree().paused = false
	get_tree().reload_current_scene()

func _on_tower1_button_pressed():
	get_parent()._on_tower_button_pressed("basic")

func _on_tower2_button_pressed():
	get_parent()._on_tower_button_pressed("rapid")

func _on_start_button_pressed():
	var main = get_parent()
	# 如果当前波次是第一波且尚未开始，直接开始
	if main.wave == 1 and not main.wave_in_progress:
		main.start_wave()
	else:
		# 否则尝试开始下一波
		main.start_next_wave()
