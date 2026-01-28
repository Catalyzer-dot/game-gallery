extends CanvasLayer

@onready var money_label = $TopLeftPanel/VBox/MoneyLabel
@onready var lives_label = $TopLeftPanel/VBox/LivesLabel
@ontml:parameter name="wave_label = $WavePanel/WaveLabel
@onready var game_over_panel = $GameOverPanel

func _ready():
	game_over_panel.visible = false

func update_money(amount: int):
	money_label.text = "💰 $" + str(amount)

func update_lives(amount: int):
	lives_label.text = "❤️ " + str(amount)

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
	get_parent().start_wave()
