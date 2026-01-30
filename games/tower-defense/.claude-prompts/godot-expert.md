# Godot开发专家模式

当需要Godot开发帮助时，可以参考以下提示词激活专家模式。

## 触发方式

在对话中说：**"作为Godot开发专家，帮我..."**

## 专家能力

### 1. 文档查询

- Godot官方文档：https://docs.godotengine.org/zh-cn/4.x/
- API参考：https://docs.godotengine.org/zh-cn/4.x/classes/
- GDScript教程：https://docs.godotengine.org/zh-cn/4.x/tutorials/scripting/gdscript/

### 2. 代码生成

- GDScript脚本
- 场景配置(.tscn)
- 资源文件(.tres)
- 导出配置

### 3. 问题诊断

- 碰撞检测问题
- 信号连接问题
- 场景树结构问题
- 性能优化

### 4. 源码参考

- GitHub仓库：https://github.com/godotengine/godot
- 可以查阅引擎实现细节

## 代码规范

```gdscript
# 变量命名：snake_case
var player_speed := 100.0
var max_health := 100

# 类名：PascalCase
class_name Player extends CharacterBody2D

# 信号：过去时
signal died
signal health_changed(new_health: int)

# 导出变量
@export var speed := 100.0
@export var damage: int = 25

# 节点引用
@onready var sprite = $Sprite2D
@onready var collision = $CollisionShape2D

# 类型提示
func take_damage(amount: int) -> void:
    health -= amount
    if health <= 0:
        die()

func get_target() -> CharacterBody2D:
    return current_target
```

## 常见场景

### 追踪导弹

```gdscript
extends Area2D

@export var speed := 400.0
@export var homing_strength := 5.0

var target: Node2D = null
var velocity := Vector2.ZERO

func _physics_process(delta):
    if target and is_instance_valid(target):
        var direction = (target.global_position - global_position).normalized()
        velocity = velocity.lerp(direction * speed, homing_strength * delta)
        position += velocity * delta
```

### 血条UI

```gdscript
extends ProgressBar

@export var target: Node = null

func _ready():
    if target:
        target.health_changed.connect(_on_health_changed)
        max_value = target.max_health
        value = target.health

func _on_health_changed(new_health: int):
    value = new_health
```

### 波次生成

```gdscript
extends Node2D

@export var spawn_interval := 2.0
@export var wave_size := 10

var enemies_spawned := 0
var spawn_timer := 0.0
var wave_in_progress := false

func _process(delta):
    if wave_in_progress:
        spawn_timer += delta
        if spawn_timer >= spawn_interval and enemies_spawned < wave_size:
            spawn_enemy()
            spawn_timer = 0.0
            enemies_spawned += 1
```

## 版本差异提醒

### Godot 3.x vs 4.x

| 功能     | Godot 3.x                         | Godot 4.x                      |
| -------- | --------------------------------- | ------------------------------ |
| 节点类型 | KinematicBody2D                   | CharacterBody2D                |
| 移动函数 | move_and_slide(velocity)          | move_and_slide(), velocity属性 |
| 导出变量 | export var                        | @export var                    |
| 节点引用 | onready var                       | @onready var                   |
| 信号连接 | connect("signal", self, "method") | signal.connect(method)         |

## 资源链接

- [Godot官方文档](https://docs.godotengine.org/zh-cn/4.x/)
- [Godot源代码](https://github.com/godotengine/godot)
- [GDScript风格指南](https://docs.godotengine.org/zh-cn/4.x/tutorials/scripting/gdscript/gdscript_styleguide.html)
- [Godot最佳实践](https://docs.godotengine.org/zh-cn/4.x/tutorials/best_practices/index.html)
