// import { runPerformanceTest } from './performanceTest';

// async function main() {
//   try {
//     await runPerformanceTest();
//     console.log('\n✅ 性能测试完成');
//   } catch (error) {
//     console.error('❌ 测试失败:', error);
//   }
// }

// main();



import { RenderSystem, TransformSystem } from 'engine/index';
import { Engine, GameObject, ShapeRenderer, ShapeType, Script } from './engine';

// 创建自定义脚本
class PlayerController extends Script {
  getTypeName() { return 'PlayerController'; }
  
  start() {
    console.log('Player started!');
  }
  
  update(deltaTime: number) {
    // 更新逻辑
  }
}

// 初始化游戏
const engine = Engine.instance;

// 注册系统
engine.registerSystem('Transform', new TransformSystem());
engine.registerSystem('Render', new RenderSystem('gameCanvas'));

// 创建游戏对象
const player = new GameObject('Player');
player.transform.position.x = 100;
player.transform.position.y = 100;

// 添加组件
const renderer = player.addComponent(ShapeRenderer);
renderer.shapeType = ShapeType.Rectangle;
renderer.fillColor = '#4CAF50';

// 添加脚本
player.addComponent(PlayerController);

// 启动游戏
engine.start();