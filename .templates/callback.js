/* eslint-disable @typescript-eslint/no-require-imports */
// const fs = require('fs')
const { join } = require('path')
// const { cwd } = require('process')
const { Project, ts, Scope } = require('ts-morph')
const prettier = require('prettier')

exports.newFolder = async (path, params) => {
  const project = new Project({
    tsConfigFilePath: join(path, '../../../../tsconfig.node.json')
  })
  project.addSourceFilesAtPaths(join(path, '../app.router.ts'))
  const sourceFile = project.getSourceFile(join(path, '../app.router.ts'))
  sourceFile.addImportDeclaration({
    defaultImport: [`${params.serviceNameClass}Router`],
    moduleSpecifier: `./${params.serviceName}/${params.serviceName}.router`
  })
  const classDeclaration = sourceFile?.getClass('AppRouterFactory')
  const constructors = classDeclaration?.getConstructors()
  constructors[0].addParameter({
    decorators: [{ name: 'inject', arguments: [`${params.serviceNameClass}Router`] }],
    scope: Scope.Private,
    name: `${params.serviceName}Router`,
    type: `${params.serviceNameClass}Router`
  })
  const createMethod = classDeclaration?.getMethod('create')
  const createMethodBody = createMethod.getBody()
  const callExpressionList = createMethodBody.getDescendantsOfKind(ts.SyntaxKind.CallExpression)
  for (const child of callExpressionList) {
    console.log('child:', child)
    if (child.compilerNode.expression.getText() === 'mergeRouters') {
      child.transform(() => {
        return ts.factory.updateCallExpression(
          child.compilerNode,
          child.compilerNode.expression,
          undefined,
          [
            ...child
              .getChildrenOfKind(ts.SyntaxKind.CallExpression)
              .map((item) => item.compilerNode),
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createThis(),
                  ts.factory.createIdentifier(`${params.serviceName}Router`)
                ),
                ts.factory.createIdentifier('allRouter')
              ),
              undefined,
              []
            )
          ]
        )
      })
      break
    }
  }
  const config = await prettier.resolveConfig(join(path, '../../../.prettierrc.yaml'))
  const res = await prettier.format(sourceFile.getText(), {
    ...config,
    parser: 'typescript'
  })
  sourceFile.replaceWithText(res)
  sourceFile.save()
}

exports.newFile = (path, params) => {
  console.log(path, params)
}

exports.finish = () => {
  console.log('finish')
}

// newFolder(cwd(), {
//   serviceName: 'test',
//   serviceNameClass: 'Test'
// })
