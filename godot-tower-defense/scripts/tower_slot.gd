extends Area2D

signal slot_clicked(slot)

var occupied := false
var tower_instance = null

@onready var sprite = $Sprite2D
@onready var indicator = $Indicator

func _ready():
	input_event.connect(_on_input_event)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	update_visual()

func _on_input_event(_viewport, event, _shape_idx):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if not occupied:
			emit_signal("slot_clicked", self)

func _on_mouse_entered():
	if not occupied:
		indicator.modulate = Color(1, 1, 1, 0.8)

func _on_mouse_exited():
	if not occupied:
		indicator.modulate = Color(1, 1, 1, 0.3)

func occupy(tower):
	occupied = true
	tower_instance = tower
	update_visual()

func update_visual():
	if occupied:
		sprite.modulate = Color(0.3, 0.3, 0.3, 0.5)
		indicator.visible = false
	else:
		sprite.modulate = Color(0.5, 0.7, 0.5, 0.7)
		indicator.visible = true
		indicator.modulate = Color(1, 1, 1, 0.3)
