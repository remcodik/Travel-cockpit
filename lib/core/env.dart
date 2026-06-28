// Setup: create .env in project root with ANTHROPIC_API_KEY=sk-ant-...
// Then run: flutter pub run build_runner build
import 'package:envied/envied.dart';
part 'env.g.dart';

@Envied(path: '.env')
abstract class Env {
  @EnviedField(varName: 'ANTHROPIC_API_KEY', obfuscate: true)
  static final String anthropicApiKey = _Env.anthropicApiKey;
}
